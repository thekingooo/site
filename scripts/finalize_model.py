"""Denoise Cycles light atlases using official Intel OIDN, then export GLB.

blender -b office.blend --python-exit-code 1 --python scripts/finalize_model.py -- \
  --directory /path/to/build --oidn /path/to/oidnDenoise

This processes the actual 3D render and its UV lightmaps, not AI artwork.
"""
import argparse
import subprocess
import tempfile
import sys
from pathlib import Path

import bpy
import numpy as np

parser=argparse.ArgumentParser()
parser.add_argument("--directory",required=True)
parser.add_argument("--oidn",required=True)
parser.add_argument("--preview-only",action="store_true")
parser.add_argument("--scene",default="office")
parser.add_argument("--render",action="store_true")
args=parser.parse_args(sys.argv[sys.argv.index("--")+1:])
directory=Path(args.directory).resolve()

def denoise(image,filter_type):
    width,height=image.size[:]
    rgba=np.empty(width*height*4,dtype=np.float32)
    image.pixels.foreach_get(rgba)
    rgba=rgba.reshape(height,width,4)
    color=np.ascontiguousarray(rgba[:,:,:3])
    print("DENOISING",image.name,width,height,filter_type,flush=True)
    # Run the official CLI in a separate process: Blender and OIDN ship
    # different TBB runtimes, which must not be loaded into the same process.
    with tempfile.TemporaryDirectory(prefix="oidn-",dir=directory) as temp:
        source=Path(temp)/"input.pfm";destination=Path(temp)/"output.pfm"
        with source.open("wb") as stream:
            stream.write(f"PF\n{width} {height}\n-1.0\n".encode())
            color.astype("<f4").tofile(stream)
        subprocess.run([str(Path(args.oidn).resolve()),"--device","cpu","--filter",filter_type,"--hdr",str(source),"--output",str(destination),"--threads","5"],check=True)
        with destination.open("rb") as stream:
            if stream.readline().strip()!=b"PF":raise RuntimeError("Invalid OIDN result")
            if tuple(map(int,stream.readline().split()))!=(width,height):raise RuntimeError("Wrong OIDN result dimensions")
            scale=float(stream.readline())
            output=np.fromfile(stream,dtype="<f4" if scale<0 else ">f4")
            if output.size!=width*height*3:raise RuntimeError("Incomplete OIDN output")
            output=output.reshape(height,width,3)
    rgba[:,:,:3]=np.maximum(output,0)
    image.pixels.foreach_set(rgba.ravel())
    image.update()

for image in list(bpy.data.images):
    if image.name.endswith("irradiance"):
        denoise(image,"RTLightmap")
        image.filepath_raw=str(directory/f"{image.name}.png")
        image.file_format="PNG"
        image.save()
        image.pack()

name=Path(bpy.data.filepath).stem if bpy.data.filepath else args.scene
render_path=directory/f"{name}-linear.exr"
if render_path.exists():
    render=bpy.data.images.load(str(render_path),check_existing=False)
    denoise(render,"RT")
    bpy.context.scene.render.image_settings.file_format="PNG"
    bpy.context.scene.render.image_settings.color_depth="8"
    render.save_render(str(directory/f"{name}-review.png"),scene=bpy.context.scene)
if args.preview_only:sys.exit(0)

engineering=bpy.data.objects.get("Engineering")
if engineering:engineering.rotation_euler=(-.2,.1,0)
for mat in bpy.data.materials:
    if mat.use_nodes and any(label in mat.name for label in ["Natural walnut","Oiled oak","Smoked walnut"]):
        shader=mat.node_tree.nodes.get("Principled BSDF")
        if shader:shader.inputs["Emission Strength"].default_value=.85

if args.render:
    from mathutils import Vector
    camera=bpy.context.scene.camera
    camera.location=(11.5,-13,3.9)
    camera.rotation_euler=(Vector((0,0,2.6))-camera.location).to_track_quat("-Z","Y").to_euler()
    camera.data.lens=39
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.16))
    ground=bpy.context.object;ground.name="Review studio ground"
    material=bpy.data.materials.new("Review studio graphite");material.use_nodes=True
    shader=material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value=(.015,.017,.016,1)
    shader.inputs["Roughness"].default_value=.85
    ground.data.materials.append(material)
    bpy.context.scene.cycles.samples=48
    bpy.context.scene.cycles.use_denoising=False
    bpy.context.scene.render.filepath=str(directory/f"{name}-baked-render.png")
    bpy.ops.render.render(write_still=True)
    rendered=bpy.data.images["Render Result"]
    # Render Result cannot be modified directly; reload a linear EXR copy.
    bpy.context.scene.render.image_settings.file_format="OPEN_EXR"
    bpy.context.scene.render.image_settings.color_depth="32"
    rendered.save_render(str(directory/f"{name}-baked-linear.exr"),scene=bpy.context.scene)
    image=bpy.data.images.load(str(directory/f"{name}-baked-linear.exr"),check_existing=False)
    denoise(image,"RT")
    bpy.context.scene.render.image_settings.file_format="PNG"
    bpy.context.scene.render.image_settings.color_depth="8"
    image.save_render(str(directory/f"{name}-review.png"),scene=bpy.context.scene)

for filename,names in [("architecture",["Shell","Foundation","Engineering"]),(name,["Interior"])]:
    bpy.ops.object.select_all(action="DESELECT")
    for root_name in names:
        root=bpy.data.objects.get(root_name)
        if not root:raise RuntimeError(f"Missing layer: {root_name}")
        root.select_set(True)
        for child in root.children_recursive:child.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(directory/f"{filename}.glb"),export_format="GLB",use_selection=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False,export_image_format="AUTO",export_materials="EXPORT",export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath=str(directory/f"{name}-baked.blend"))
print("FINALIZED",directory,flush=True)
