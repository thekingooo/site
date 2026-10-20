"""Reproducible Blender scene; all geometry is authored in metres, Z up.

blender -b --factory-startup -t 5 --python scripts/build_architecture.py -- \
  --scene office --preview --bake --output public/models

The GLB keeps four separate roots: Shell, Foundation, Engineering, Interior.
Cycles indirect illumination is baked into an emissive atlas for nonmetallic
surfaces; glass and metals retain real-time PBR materials and reflections.
"""
import argparse
import math
import random
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source"
parser = argparse.ArgumentParser()
parser.add_argument("--scene", default="office", choices=["office"])
parser.add_argument("--preview", action="store_true")
parser.add_argument("--bake", action="store_true")
parser.add_argument("--output", default=str(ROOT / "public" / "models"))
parser.add_argument("--resolution", type=int, default=1536)
parser.add_argument("--samples", type=int, default=48)
parser.add_argument("--atlas-size", type=int, default=1536)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
OUT = Path(args.output).resolve()
OUT.mkdir(parents=True, exist_ok=True)
random.seed(812)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = False  # Debian Blender build omits OpenImageDenoise.
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .035
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 4
scene.cycles.glossy_bounces = 4
scene.cycles.transparent_max_bounces = 12
scene.render.threads_mode = "FIXED"
scene.render.threads = 5
scene.unit_settings.system = "METRIC"
scene.view_settings.view_transform = "AgX"
scene.render.resolution_x = args.resolution
scene.render.resolution_y = int(args.resolution * 2 / 3)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False

groups = {}
for name in ["Shell", "Foundation", "Engineering", "Interior"]:
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    groups[name] = obj
groups["Engineering"].location.z = 5.2
layer = "Shell"


def rgb(hex_color):
    h = hex_color.lstrip("#")
    channels = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels) + (1,)


def material(name, color, rough=.6, metal=0, kind=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = rgb(color)
    mat["bake_surface"] = not metal and kind not in ("glass", "emission")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = rgb(color)
    shader.inputs["Roughness"].default_value = rough
    shader.inputs["Metallic"].default_value = metal
    if kind == "glass":
        shader.inputs["Transmission Weight"].default_value = 1
        shader.inputs["IOR"].default_value = 1.46
        shader.inputs["Roughness"].default_value = .065
    if kind == "emission":
        shader.inputs["Emission Color"].default_value = rgb(color)
        shader.inputs["Emission Strength"].default_value = 4
    if kind in ("concrete", "stone", "cloth", "wood", "marble", "leaf"):
        coord = nodes.new("ShaderNodeTexCoord")
        mapping = nodes.new("ShaderNodeVectorMath")
        mapping.operation = "MULTIPLY"
        links.new(coord.outputs["Object"], mapping.inputs[0])
        mapping.inputs[1].default_value = (1, 1, 1)
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 4 if kind in ("stone", "marble") else 100 if kind == "cloth" else 12
        noise.inputs["Detail"].default_value = 4
        noise.inputs["Roughness"].default_value = .65
        links.new(mapping.outputs[0], noise.inputs["Vector"])
        ramp = nodes.new("ShaderNodeValToRGB")
        base = rgb(color)
        for el, multiplier, pos in [(ramp.color_ramp.elements[0], .65, .15), (ramp.color_ramp.elements[1], 1.18, .85)]:
            el.position = pos
            el.color = tuple(min(1, c * multiplier) for c in base[:3]) + (1,)
        links.new(noise.outputs["Fac"], ramp.inputs[0])
        links.new(ramp.outputs[0], shader.inputs["Base Color"])
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = .22
        bump.inputs["Distance"].default_value = .0015 if kind == "cloth" else .004
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs[0], shader.inputs["Normal"])
        if kind == "wood":
            mapping.inputs[1].default_value = (3, 3, .13)
            noise.inputs["Scale"].default_value = 11
            shader.inputs["Coat Weight"].default_value = .2
            shader.inputs["Coat Roughness"].default_value = .35
            photo = nodes.new("ShaderNodeTexImage")
            photo.image = bpy.data.images.load(str(SOURCE/"wood-diffuse.jpg"), check_existing=True)
            photo.projection = "BOX"
            photo.projection_blend = .1
            photo.extension = "REPEAT"
            photo_mapping = nodes.new("ShaderNodeVectorMath")
            photo_mapping.operation = "MULTIPLY"
            photo_mapping.inputs[1].default_value = (.55,.55,.18)
            links.new(coord.outputs["Object"], photo_mapping.inputs[0])
            links.new(photo_mapping.outputs[0], photo.inputs["Vector"])
            luminance = nodes.new("ShaderNodeRGBToBW")
            links.new(photo.outputs["Color"], luminance.inputs[0])
            links.new(luminance.outputs[0], ramp.inputs[0])
            ramp.color_ramp.elements[0].position=.05
            ramp.color_ramp.elements[0].color=tuple(c*.8 for c in base[:3])+(1,)
            ramp.color_ramp.elements[1].position=.65
            ramp.color_ramp.elements[1].color=tuple(min(1,c*1.15) for c in base[:3])+(1,)
            links.new(ramp.outputs[0],shader.inputs["Base Color"])
        if kind == "concrete":
            fine = nodes.new("ShaderNodeTexNoise")
            fine.inputs["Scale"].default_value = 210
            links.new(coord.outputs["Object"], fine.inputs["Vector"])
            links.new(fine.outputs["Fac"], bump.inputs["Height"])
            bump.inputs["Distance"].default_value = .0015
        if kind == "marble":
            mapping.inputs[1].default_value = (1, 2, .5)
            ramp.color_ramp.elements[0].color = rgb("26352e")
            ramp.color_ramp.elements[0].position = .44
            ramp.color_ramp.elements[1].color = rgb("c2b294")
            ramp.color_ramp.elements[1].position = .49
            extra = ramp.color_ramp.elements.new(.54)
            extra.color = rgb("2c3a32")
            shader.inputs["Coat Weight"].default_value = .4
            shader.inputs["Coat Roughness"].default_value = .2
        if kind == "cloth":
            shader.inputs["Sheen Weight"].default_value = .35
            shader.inputs["Sheen Roughness"].default_value = .7
    return mat


M = {
    "concrete": material("Cast concrete / fine pores", "9c9991", .92, kind="concrete"),
    "dark_concrete": material("Concrete cut edges", "77766e", .9, kind="concrete"),
    "stone": material("Honed warm limestone", "c3b8a1", .5, kind="stone"),
    "ivory": material("Warm mineral plaster", "d1c7b6", .8, kind="stone"),
    "wood": material("Natural walnut", "805937", .42, kind="wood"),
    "oak": material("Oiled oak", "a58253", .45, kind="wood"),
    "darkwood": material("Smoked walnut", "3c2b20", .5, kind="wood"),
    "metal": material("Galvanized dark steel", "656863", .33, .83),
    "black": material("Blackened steel", "242625", .38, .65),
    "brass": material("Brushed antique brass", "9f8255", .29, .82),
    "chrome": material("Brushed chrome", "b7b9ae", .23, .93),
    "glass": material("Clear architectural glass", "dfe9e3", .06, kind="glass"),
    "cloth": material("Oatmeal woven upholstery", "c7bda8", .91, kind="cloth"),
    "rug": material("Natural wool rug", "aea492", .98, kind="cloth"),
    "leather": material("Saddle leather", "8f5d36", .52, kind="cloth"),
    "sage": material("Olive velvet", "6a7050", .85, kind="cloth"),
    "mesh": material("Anthracite chair mesh", "373a36", .8, kind="cloth"),
    "leaf": material("Olive foliage", "3f5935", .68, kind="leaf"),
    "leaf_dark": material("Deep green foliage", "354c2c", .75, kind="leaf"),
    "bark": material("Olive bark", "66503a", .9, kind="wood"),
    "soil": material("Potting soil", "30271d", 1, kind="concrete"),
    "marble": material("Verde marble", "344336", .22, kind="marble"),
    "white": material("Warm white porcelain", "e5dfd0", .2),
    "paper": material("Book paper", "d3c8b0", .9),
    "screen": material("Glossy black display", "101718", .17, .28),
    "warm": material("2700K linear light", "ffd29a", .3, kind="emission"),
    "neutral": material("Neutral task light", "fff2da", .3, kind="emission"),
}


def link(obj, mat, name):
    obj.name = name
    if mat:
        obj.data.materials.append(M[mat] if isinstance(mat, str) else mat)
    scene.collection.objects.link(obj)
    obj.parent = groups[layer]
    return obj


def box(name, p, s, mat, bevel=.012, rot=0):
    x, y, z = (v / 2 for v in s)
    verts = [(-x,-y,-z),(-x,-y,z),(-x,y,-z),(-x,y,z),(x,-y,-z),(x,-y,z),(x,y,-z),(x,y,z)]
    faces = [(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [tuple(reversed(face)) for face in faces])
    mesh.update()
    obj = link(bpy.data.objects.new(name, mesh), mat, name)
    obj.location = p
    obj.rotation_euler.z = rot
    if bevel:
        mod = obj.modifiers.new("Crafted edge", "BEVEL")
        mod.width = min(bevel, min(s) * .35)
        mod.segments = 3
        mod.harden_normals = True
        normal = obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
        normal.keep_sharp = True
        normal.weight = 40
    return obj


def cylinder(name, p, radius, depth, mat, top=None, direction=(0,0,1), vertices=32):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius if top is None else top, depth=depth, location=(0,0,0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = groups[layer]
    obj.location = p
    obj.rotation_euler = Vector(direction).to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(M[mat])
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    bevel = obj.modifiers.new("Machined rim", "BEVEL")
    bevel.width = min(.006, radius * .08)
    bevel.segments = 2
    return obj


def tube(name, points, radius, mat, resolution=3):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 6
    curve.bevel_depth = radius
    curve.bevel_resolution = resolution
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points)-1)
    for bp, point in zip(spline.bezier_points, points):
        bp.co = point
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    return link(bpy.data.objects.new(name, curve), mat, name)


def sphere(name, p, scale, mat, segments=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1)
    obj = bpy.context.object
    obj.name = name
    obj.parent = groups[layer]
    obj.location = p
    obj.scale = scale
    obj.data.materials.append(M[mat])
    for f in obj.data.polygons: f.use_smooth = True
    return obj


def area(name, p, target, power, size, color=(1,.75,.5), size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size if size_y is None else size_y
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = p
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()
    return obj


def slats(x, y, width, height, along="x", bottom=.12):
    count = round(width/.09)
    for i in range(count):
        px, py = (x+i*.09,y) if along=="x" else (x,y+i*.09)
        box("Walnut acoustic fin", (px,py,bottom+height/2), (.035,.055,height) if along=="x" else (.055,.035,height), "wood", .003)


def plant(x,y,scale=1):
    cylinder("Tapered stone planter", (x,y,.32*scale), .24*scale,.52*scale,"dark_concrete",top=.3*scale,vertices=48)
    cylinder("Soil",(x,y,.585*scale),.265*scale,.025,"soil")
    tube("Twisted olive trunk", [(x,y,.55*scale),(x+.035,y,1.1*scale),(x-.04,y+.03,1.8*scale),(x+.04,y,2.22*scale)],.027*scale,"bark")
    verts, faces = [], []
    for branch in range(48):
        angle=random.random()*math.tau
        height=(1.05+random.random()*1.1)*scale
        radius=(.2+random.random()*.5)*scale
        end=Vector((x+math.cos(angle)*radius,y+math.sin(angle)*radius,height))
        tube("Olive branch",[(x,y,height-.3*scale),tuple(end*.35+Vector((x,y,height))*.65),tuple(end)],.0055*scale,"bark",1)
        for leaf in range(28):
            center=end+Vector(((random.random()-.5)*.32*scale,(random.random()-.5)*.32*scale,(random.random()-.5)*.24*scale))
            a=random.random()*math.tau
            direction=Vector((math.cos(a),math.sin(a),random.uniform(-.35,.55))).normalized()
            side=direction.cross(Vector((0,0,1))).normalized()
            up=direction.cross(side).normalized()
            tilt=random.uniform(-1.3,1.3)
            side=side*math.cos(tilt)+up*math.sin(tilt)
            length=random.uniform(.08,.15)*scale
            start=len(verts)
            for k in range(5):
                t=k/4
                for w in [-1,0,1]:
                    v=center+direction*(t-.5)*length+side*(math.sin(t*math.pi)*.23*length*w)+up*(.08*length*math.sin(t*math.pi)*(1-abs(w)))
                    verts.append(tuple(v))
            for k in range(4):
                for j in range(2):
                    a0=start+k*3+j
                    faces.append((a0,a0+1,a0+4,a0+3))
    mesh=bpy.data.meshes.new("Botanical leaves"); mesh.from_pydata(verts,[],faces);mesh.update()
    obj=link(bpy.data.objects.new("Real leaf geometry",mesh),"leaf","Olive canopy")
    for f in mesh.polygons:f.use_smooth=True


def armchair(x,y,angle=0,cloth="cloth",scale=1):
    def p(dx,dy,z):return (x+scale*(math.cos(angle)*dx-math.sin(angle)*dy),y+scale*(math.sin(angle)*dx+math.cos(angle)*dy),z*scale)
    for dx in [-.29,.29]:
        for dy in [-.27,.27]:
            tube("Tapered chair leg",[p(dx*.95,dy*.95,.12),p(dx,dy,.38)],.022*scale,"darkwood",2)
    box("Sculpted seat cushion",p(0,0,.48),(.73*scale,.72*scale,.18*scale),cloth,.08*scale,angle)
    verts,faces=[],[]
    for i in range(33):
        a=-2.1+i/32*4.2
        height=.93-.22*(abs(a)/2.1)**2
        profile=[(.31,.43),(.31,height-.035),(.35,height),(.43,height-.025),(.44,.45),(.39,.4)]
        for r,z in profile:
            verts.append(p(math.sin(a)*r,math.cos(a)*r,z))
    for i in range(32):
        for j in range(6):faces.append((i*6+j,i*6+(j+1)%6,(i+1)*6+(j+1)%6,(i+1)*6+j))
    faces.extend([tuple(range(5,-1,-1)),tuple(32*6+j for j in range(6))])
    mesh=bpy.data.meshes.new("Upholstered curved shell");mesh.from_pydata(verts,[],faces);mesh.update()
    obj=link(bpy.data.objects.new("Continuous upholstered back and arms",mesh),cloth,"Upholstered curved shell")
    sub=obj.modifiers.new("Soft upholstery subdivision","SUBSURF");sub.levels=2
    for f in mesh.polygons:f.use_smooth=True
    # Piping follows the upper upholstery seam.
    seam=[]
    for i in range(25):
        a=-2.05+i/24*4.1; h=.93-.22*(abs(a)/2.1)**2
        seam.append(p(math.sin(a)*.395,math.cos(a)*.395,h-.008))
    tube("Upholstery piping",seam,.0035*scale,cloth,1)


def task_chair(x,y,angle=math.pi):
    def p(dx,dy,z):return (x+math.cos(angle)*dx-math.sin(angle)*dy,y+math.sin(angle)*dx+math.cos(angle)*dy,z)
    cylinder("Pneumatic chair stem",p(0,0,.31),.028,.35,"chrome")
    for i in range(5):
        a=i/5*math.tau
        tube("Castor support",[p(0,0,.2),p(math.cos(a)*.2,math.sin(a)*.2,.13),p(math.cos(a)*.36,math.sin(a)*.36,.1)],.022,"black",2)
        cylinder("Rubber castor",p(math.cos(a)*.36,math.sin(a)*.36,.075),.045,.045,"black",direction=(1,0,0),vertices=16)
    box("Ergonomic upholstered seat",p(0,0,.51),(.55,.52,.1),"mesh",.04,angle)
    verts,faces=[],[]
    for i in range(17):
        z=.62+i/16*.53
        width=.22+.025*math.sin(i/16*math.pi)
        for j in range(17):
            t=j/16*2-1
            verts.append(p(t*width,.23+.035*(1-t*t)+.04*math.sin(i/16*math.pi),z))
    for i in range(16):
        for j in range(16):
            a=i*17+j;faces.append((a,a+1,a+18,a+17))
    mesh=bpy.data.meshes.new("Flexible mesh back");mesh.from_pydata(verts,[],faces);mesh.update()
    obj=link(bpy.data.objects.new("Ergonomic woven mesh",mesh),"mesh","Ergonomic woven mesh")
    solid=obj.modifiers.new("Mesh thickness","SOLIDIFY");solid.thickness=.005
    for f in mesh.polygons:f.use_smooth=True
    border=[]
    for j in range(17):border.append(verts[j])
    for i in range(1,17):border.append(verts[i*17+16])
    for j in range(15,-1,-1):border.append(verts[16*17+j])
    for i in range(15,-1,-1):border.append(verts[i*17])
    border.append(border[0]);tube("Sculpted back frame",border,.019,"black",2)
    for sign in [-1,1]:
        tube("Adjustable arm support",[p(sign*.23,.12,.49),p(sign*.34,.12,.66),p(sign*.34,0,.75)],.018,"black",2)
        box("Soft armrest",p(sign*.34,-.04,.77),(.08,.32,.035),"black",.015,angle)


def table(x,y,r=.5,z=.76,mat="wood"):
    cylinder("Honed table top",(x,y,z),r,.045,mat,vertices=64)
    cylinder("Pedestal",(x,y,z/2),.045,z-.06,"black")
    cylinder("Pedestal base",(x,y,.13),r*.47,.035,"black",vertices=48)


def monitor(x,y):
    box("Display foot",(x,y,.835),(.31,.2,.022),"chrome",.008)
    box("Display stem",(x,y,.99),(.035,.035,.32),"chrome",.006)
    box("Precision display frame",(x,y,1.2),(.7,.032,.44),"black",.009)
    box("Reflective display glass",(x,y-.018,1.2),(.668,.005,.406),"screen",.004)
    box("Keyboard",(x,y-.35,.838),(.45,.15,.019),"black",.008)
    for row in range(4):
        for col in range(13):box("Key",(x-.2+col*.032,y-.405+row*.033,.851),(.027,.024,.003),"metal",.001)
    sphere("Mouse",(x+.35,y-.32,.86),(.037,.06,.02),"black",16,8)


def coffee_cup(x,y,z):
    cylinder("Cup saucer",(x,y,z),.065,.012,"white")
    cylinder("Porcelain cup",(x,y,z+.044),.035,.07,"white",top=.045)
    cylinder("Coffee surface",(x,y,z+.078),.039,.002,"darkwood")
    tube("Cup handle",[(x+.036,y,z+.025),(x+.064,y,z+.04),(x+.064,y,z+.064),(x+.04,y,z+.065)],.006,"white",2)


def build_shell():
    global layer
    layer="Shell"
    box("Floating structural floor",(0,0,-.025),(8.25,5.85,.25),"concrete",.017)
    for ix in range(8):
        for iy in range(6):box("Large format limestone tile",(-3.5+ix,-2.32+iy*.93,.118),(.997,.927,.035),"stone",.001)
    box("Back cast concrete wall",(0,2.78,1.64),(8.2,.24,3.05),"concrete",.01)
    box("Left structural wall",(-4,0,1.64),(.25,5.55,3.05),"concrete",.012)
    box("Right rear structural wall",(4,2.2,1.64),(.25,1.18,3.05),"concrete",.012)
    for x in [-4,4]:box("Front concrete pier",(x,-2.68,1.64),(.3,.28,3.12),"concrete",.009)
    for i in range(5):
        x=-3.7+i*1.5
        box("Concrete panel joint",(x,2.653,1.64),(.004,.006,3),"dark_concrete",0)
    for i in range(4):box("Side concrete panel joint",(-3.87,-1.9+i*1.4,1.64),(.005,.004,3),"dark_concrete",0)
    for x in [-3.65,-2.9,-2.1,-1.35,-.6,.2,1,1.8,2.6,3.4]:
        for z in [.55,2.75]:cylinder("Formwork tie recess",(x,2.649,z),.012,.004,"dark_concrete",direction=(0,1,0),vertices=12)
    # Interior bulkheads are essential: the room is not an empty open box.
    box("Left timber ceiling raft",(-2.15,.15,3.04),(3.65,5,.15),"wood",.01)
    box("Right timber ceiling raft",(2.5,.9,3.0),(2.7,3.6,.22),"wood",.01)
    box("Left front concrete lintel",(-2.4,-2.54,3.2),(3.3,.3,.22),"concrete",.009)
    box("Left mineral panel",(-3.82,-.8,1.55),(.04,3.3,2.82),"ivory",.004)
    slats(-3.79,-2.36,.7,2.87,"y")
    slats(-3.8,1.03,1.4,2.87,"y")
    slats(-3.65,2.62,7.4,2.9)
    # Recessed linear lighting, geometrically thin and continuous.
    box("Wall washer left",(-3.75,-.8,2.98),(.014,3.45,.014),"warm",0)
    box("Rear wall washer",(0,2.5,2.99),(7.4,.012,.012),"warm",0)
    box("Right ceiling line",(2.5,-.89,2.9),(2.6,.012,.012),"warm",0)
    for x,y in [(-3.3,-1.8),(-2,-1.8),(-.8,1.8),(1.8,.3),(3.2,.3),(2.5,2.1)]:
        cylinder("Recessed downlight bezel",(x,y,2.948),.037,.012,"black",vertices=24)
        cylinder("Recessed lens",(x,y,2.94),.028,.003,"warm",vertices=24)
    for y in [-1.9,.8]:
        cylinder("Bronze wall sconce",(-3.74,y,1.9),.045,.22,"brass")
        sphere("Opal sconce diffuser",(-3.70,y,1.92),(.045,.045,.10),"warm")


def build_foundation():
    global layer
    layer="Foundation"
    box("Lower concrete foundation",(0,0,-.91),(8.6,6.15,.22),"concrete",.018)
    for x in [-4.18,4.18]:box("Perimeter upstand",(x,0,-.68),(.22,6.05,.3),"concrete",.012)
    for y in [-2.96,2.96]:box("Perimeter upstand",(0,y,-.68),(8.45,.21,.3),"concrete",.012)
    for x in [-3,-1.5,0,1.5,3]:box("Subfloor insulation panel",(x,0,-.62),(1.47,5.55,.16),"stone",.004)
    for j in range(4):
        y=-.5+j*.15
        tube("Subfloor service pipe",[(-3.9,y,-.39),(0,y,-.39),(2.5,y,-.39),(3.65,y+.5,-.39),(3.65,2.8,-.39)],.032+j*.004,"metal" if j%2 else "brass",2)
    for x in [-3.45,2.6]:
        box("Underfloor cable tray",(x,0,-.40),(.26,5.5,.07),"metal",.005)
        for j in range(28):box("Cable tray crossbar",(x,-2.65+j*.2,-.35),(.26,.018,.014),"chrome",.001)
    box("Underfloor service accent",(-2.9,-2.8,-.48),(2.1,.015,.015),"warm",0)


def build_roof():
    global layer
    layer="Engineering"
    box("Full cast concrete ceiling slab",(0,0,.36),(8.3,5.9,.25),"concrete",.018)
    for y in [-1.8,.1,1.9]:box("Concrete downstand beam",(0,y,.16),(8.05,.2,.22),"dark_concrete",.008)
    cylinder("Galvanized main spiral duct",(0,1.25,-.12),.225,7.4,"metal",direction=(1,0,0),vertices=48)
    # Real helical seams along the spiral duct, and separate clamp rings.
    for j in range(13):
        x=-3.45+j*.55
        cylinder("Duct clamp",(x,1.25,-.12),.233,.022,"chrome",direction=(1,0,0),vertices=48)
        tube("Duct suspension",[(x,1.25-.2,.2),(x,1.25-.2,-.12),(x,1.25,-.35),(x,1.25+.2,-.12),(x,1.25+.2,.2)],.009,"black",1)
    for x in [-2.9,-.95,1,2.95]:
        box("Rectangular HVAC branch",(x,-.1,-.16),(.47,2.65,.3),"metal",.015)
        box("HVAC diffuser",(x,-1.52,-.21),(.57,.5,.17),"black",.01)
        for k in range(8):box("Diffuser louvre",(x-.235+k*.067,-1.52,-.302),(.016,.42,.018),"chrome",.001)
        for y in [.7,-.2,-1.0]:box("Duct flange",(x,y,-.16),(.495,.025,.325),"chrome",.002)
    box("Air handling unit",(2.7,1.9,-.11),(1.25,.75,.56),"metal",.016)
    for i in range(14):box("Intake grille",(2.14+i*.085,1.51,-.11),(.026,.018,.43),"black",.001)
    for j in range(4):
        y=.1+j*.13
        tube("Copper service circuit",[(-3.8,y,-.37),(-2.3,y,-.37),(-1.8,y-.3,-.37),(3.7,y-.3,-.37)],.018,"brass",2)
    box("Electrical cable ladder",(.2,-2.15,-.12),(7.6,.28,.08),"black",.003)
    for i in range(37):box("Cable ladder rung",(-3.4+i*.2,-2.15,-.065),(.018,.28,.016),"metal",.001)
    for y in [-2.4,.85]:
        box("Suspended linear fixture",(0,y,-.65),(7.4,.055,.065),"black",.007)
        box("Linear opal diffuser",(0,y,-.687),(7.3,.043,.009),"warm",.002)
        for x in [-3.3,0,3.3]:cylinder("Light suspension wire",(x,y,-.18),.0045,.88,"black",vertices=8)
    for x in [-3,-1.5,0,1.5,3]:
        cylinder("Track spotlight",(x,-1.8,-.63),.065,.19,"black",direction=(0,-.16,-1),vertices=32)
        cylinder("Spotlight lens",(x,-1.817,-.73),.052,.006,"warm",direction=(0,-.16,-1),vertices=24)


def glass_partition(x,y,width,height=2.76):
    box("Meeting room glass",(x,y,.12+height/2),(width,.018,height),"glass",.002)
    for dx in [-width/2,0,width/2]:box("Bronze partition mullion",(x+dx,y,.12+height/2),(.025,.035,height),"black",.003)
    for z in [.13,height+.12]:box("Partition rail",(x,y,z),(width,.04,.025),"black",.002)


def build_office():
    global layer
    layer="Interior"
    glass_partition(-1.5,.45,3.75)
    box("Side meeting glass",(.38,1.54,1.5),(.018,2.18,2.76),"glass",.002)
    for y in [.45,2.63]:box("Meeting corner post",(.38,y,1.5),(.03,.03,2.8),"black",.003)
    # Meeting room: warm leather chairs and a continuous oak table.
    box("Meeting table",(-1.55,1.56,.85),(2.45,1.04,.075),"oak",.024)
    for x in [-2.5,-.6]:box("Meeting table trestle",(x,1.56,.48),(.06,.8,.72),"black",.009)
    for x in [-2.25,-1.35,-.45]:
        armchair(x,.73,math.pi,"leather",.9)
        armchair(x,2.32,0,"leather",.9)
    tube("Meeting room pendant ring",[(-2.2,1.56,2.26),(-1.55,1.18,2.26),(-.9,1.56,2.26),(-1.55,1.94,2.26),(-2.2,1.56,2.26)],.016,"warm",3)
    for x in [-2.1,-1.0]:cylinder("Pendant wire",(x,1.56,2.66),.004,.8,"black",vertices=8)
    # Lounge at the open front left, with a sculpted upholstered chair.
    box("Lounge wool rug",(-2.7,-1.4,.151),(2.0,1.85,.018),"rug",.008)
    armchair(-2.8,-1.3,-.18,"cloth",1.05)
    table(-1.95,-1.5,.29,.52,"darkwood")
    coffee_cup(-1.95,-1.5,.55)
    box("Framed abstract art",(-3.738,-.67,1.9),(.035,.77,1.08),"darkwood",.006)
    box("Canvas",(-3.712,-.67,1.9),(.012,.71,1.02),"paper",.003)
    for i in range(5):
        sphere("Abstract relief composition",(-3.7,-.8+random.random()*.3,1.58+random.random()*.65),(.012,.1+random.random()*.08,.12+random.random()*.1),"darkwood" if i%2 else "stone",12,8)
    # Two working places, with cable grommets, drawers and real ergonomic chairs.
    box("Task area wool rug",(1.3,-1.31,.151),(4.1,2.2,.018),"rug",.008)
    for x in [.35,2.15]:
        box("Oak desktop",(x,-.9,.82),(1.75,.83,.065),"oak",.017)
        for dx in [-.73,.73]:
            for dy in [-.32,.32]:box("Desk steel leg",(x+dx,-.9+dy,.475),(.035,.035,.68),"black",.004)
        box("Desk pedestal",(x-.49,-.78,.46),(.43,.55,.63),"black",.018)
        for z in [.35,.55,.72]:box("Drawer line",(x-.49,-1.059,z),(.38,.003,.005),"metal",0)
        monitor(x,-.64)
        task_chair(x,-1.93)
        coffee_cup(x+.6,-.85,.86)
        box("Closed notebook",(x-.52,-1.02,.865),(.22,.29,.018),"leather",.004,rot=.08)
    # Reception/storage joins the rear timber-lined zone.
    box("Stone credenza",(3.15,1.5,.65),(1.2,.66,1.05),"marble",.012)
    box("Credenza stone top",(3.15,1.5,1.21),(1.26,.71,.06),"stone",.012)
    cylinder("Desk lamp stem",(3.15,1.5,1.47),.012,.47,"brass")
    sphere("Opaline mushroom lamp",(3.15,1.5,1.64),(.13,.13,.11),"warm")
    # Built-in bookcase: separate spines, pages, decorative vessels and light.
    box("Inset bookcase back",(2.65,2.55,1.71),(2,.09,2.6),"darkwood",.006)
    for z in [.43,1.02,1.61,2.2,2.8]:
        box("Walnut shelf",(2.65,2.35,z),(2,.4,.04),"wood",.006)
        box("Shelf recessed light",(2.65,2.19,z-.026),(1.9,.012,.012),"warm",0)
        if z<2.8:
            for k in range(7):
                x=1.84+k*.19
                h=.19+random.random()*.15
                box("Book pages",(x,2.32,z+.04+h/2),(.07,.16,h),"paper",.002)
                box("Book linen spine",(x,2.228,z+.04+h/2),(.078,.012,h+.008),"cloth" if k%2 else "leather",.002)
    plant(-3.45,-2.03,1.0)
    plant(-1.05,-.05,.63)
    plant(3.35,-2.0,.85)
    plant(1.3,2.12,.65)


build_shell()
build_foundation()
build_roof()
build_office()
# The lifted assembly is tilted in the exploded presentation so its underside
# is legible from the same perspective as the room. It remains actual geometry.
groups["Engineering"].rotation_euler = (-.2,.1,0)

# True studio lighting for both the Cycles comparison render and the bake.
world=bpy.data.worlds.new("Dark architectural studio")
world.use_nodes=True
world.node_tree.nodes["Background"].inputs[0].default_value=(.09,.10,.10,1)
world.node_tree.nodes["Background"].inputs[1].default_value=.22
scene.world=world
area("Large soft key",(-4,-6,7),(0,0,1.5),650,7,(1,.86,.68),5)
area("Soft front fill",(6,-5,4),(0,0,1.4),190,5,(.85,.9,1),5)
area("Warm back rim",(-3,6,6),(0,0,2),850,4,(1,.72,.43),5)
area("Left wall wash",(-3.45,-.8,2.8),(-3.8,-.8,1.4),48,2.5,(1,.66,.34),.12)
area("Rear wall wash",(0,2.32,2.8),(0,2.6,1.5),65,6.8,(1,.65,.32),.15)
area("Office light",(1.5,-.8,2.85),(1.5,-.8,.4),105,2.8,(1,.78,.52),1.2)
area("Meeting light",(-1.5,1.5,2.85),(-1.5,1.5,.6),95,2.6,(1,.78,.52),1.4)
area("Engineering linear light",(0,-1.0,4.65),(0,-1.0,.8),85,6.7,(1,.72,.4),.08)

camera_data=bpy.data.cameras.new("Reference camera")
camera=bpy.data.objects.new("Reference camera",camera_data)
scene.collection.objects.link(camera)
camera.location=(11.5,-13,3.9)
camera.rotation_euler=(Vector((0,0,2.6))-camera.location).to_track_quat("-Z","Y").to_euler()
camera_data.type="PERSP"
camera_data.lens=39
camera_data.sensor_width=36
scene.camera=camera

# Model modifiers are applied once before UV packing / export.
bpy.ops.object.select_all(action="DESELECT")
for obj in list(scene.objects):
    if obj.type in {"MESH","CURVE"}:
        obj.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in scene.objects if o.type=="MESH")
bpy.ops.object.convert(target="MESH")
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
for obj in scene.objects:
    if obj.type=="MESH":
        bm=bmesh.new();bm.from_mesh(obj.data)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(obj.data);bm.free();obj.data.update()
bpy.ops.object.select_all(action="DESELECT")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f"{args.scene}-unbaked.blend"))

if args.preview:
    # Ground is for studio contact shadows, excluded from the GLB model.
    layer="Shell"
    ground=box("Studio ground",(0,0,-1.16),(200,200,.1),"black",0)
    ground.parent=None
    ground.data.materials.clear()
    ground.data.materials.append(material("Studio graphite floor","171918",.8))
    scene.render.filepath=str(OUT / f"{args.scene}-cycles.png")
    bpy.ops.render.render(write_still=True)
    scene.render.image_settings.file_format="OPEN_EXR"
    scene.render.image_settings.color_depth="32"
    bpy.data.images["Render Result"].save_render(str(OUT/f"{args.scene}-linear.exr"), scene=scene)
    scene.render.image_settings.file_format="PNG"
    bpy.data.objects.remove(ground,do_unlink=True)

if args.bake:
    scene.cycles.samples=16
    scene.render.bake.use_pass_direct=True
    scene.render.bake.use_pass_indirect=True
    scene.render.bake.use_pass_color=True
    scene.render.bake.use_pass_diffuse=True
    scene.render.bake.use_pass_glossy=False
    scene.render.bake.use_pass_transmission=False
    scene.render.bake.use_pass_emit=False
    scene.render.bake.margin=12
    scene.render.bake.use_clear=True
    baked_targets=[]
    for group_name in ["Shell","Foundation","Engineering","Interior"]:
        meshes=[o for o in scene.objects if o.type=="MESH" and o.parent==groups[group_name] and any(s.material and s.material.get("bake_surface") for s in o.material_slots)]
        if not meshes:continue
        bpy.ops.object.select_all(action="DESELECT")
        for o in meshes:o.select_set(True)
        bpy.context.view_layer.objects.active=meshes[0]
        bpy.ops.object.join()
        meshes=[bpy.context.view_layer.objects.active]
        # A single atlas is shared by every surface in this architectural layer.
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.008,area_weight=.2,correct_aspect=True,scale_to_bounds=True)
        bpy.ops.object.mode_set(mode="OBJECT")
        image=bpy.data.images.new(f"{args.scene}-{group_name}-irradiance",width=args.atlas_size,height=args.atlas_size,alpha=False,float_buffer=False)
        image.generated_color=(.02,.02,.02,1)
        # Copies isolate the target image from other groups sharing materials.
        copies={}
        for obj in meshes:
            for slot in obj.material_slots:
                if not slot.material or not slot.material.get("bake_surface"):continue
                original=slot.material
                if original.name not in copies:
                    copy=original.copy();copy.name=f"{group_name} / {original.name}"
                    target=copy.node_tree.nodes.new("ShaderNodeTexImage");target.image=image
                    copy.node_tree.nodes.active=target
                    copies[original.name]=copy
                slot.material=copies[original.name]
        print("BAKING",group_name,len(meshes),flush=True)
        bpy.ops.object.bake(type="DIFFUSE")
        baked_targets.append((image,copies))
        image.filepath_raw=str(OUT/f"{args.scene}-{group_name.lower()}-light.png")
        image.file_format="PNG";image.save();image.pack()
    for image,copies in baked_targets:
        # Emissive GI preserves the Cycles solution in WebGL. Fresnel/specular
        # reflections remain dynamic on the black-base physical material.
        for mat in copies.values():
            nodes,links=mat.node_tree.nodes,mat.node_tree.links
            shader=nodes.get("Principled BSDF")
            for socket_name in ["Base Color","Normal"]:
                for link in list(shader.inputs[socket_name].links):links.remove(link)
            shader.inputs["Base Color"].default_value=(0,0,0,1)
            shader.inputs["Metallic"].default_value=0
            shader.inputs["Sheen Weight"].default_value=0
            target=next(n for n in nodes if n.type=="TEX_IMAGE" and n.image==image)
            links.new(target.outputs["Color"],shader.inputs["Emission Color"])
            shader.inputs["Emission Strength"].default_value=1

# Consolidate mesh primitives by architectural layer. The GLB still preserves
# material assignments and separate layer transforms, with bounded draw calls.
for group_name,root in groups.items():
    children=[o for o in scene.objects if o.type=="MESH" and o.parent==root]
    if not children:continue
    bpy.ops.object.select_all(action="DESELECT")
    for o in children:o.select_set(True)
    bpy.context.view_layer.objects.active=children[0]
    bpy.ops.object.join()
    bpy.context.object.name=f"{group_name}Geometry"
    bpy.ops.object.material_slot_remove_unused()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f"{args.scene}.blend"))
for filename,root_names in [("architecture",["Shell","Foundation","Engineering"]),(args.scene,["Interior"])]:
    bpy.ops.object.select_all(action="DESELECT")
    for name in root_names:
        root=groups[name]
        root.select_set(True)
        for child in root.children_recursive:child.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/f"{filename}.glb"),export_format="GLB",use_selection=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False,export_image_format="AUTO",export_materials="EXPORT",export_animations=False)
    print("EXPORTED",OUT/f"{filename}.glb",flush=True)
