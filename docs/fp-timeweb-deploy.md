# FP Group: installation through the Timeweb SSH console

The user confirmed the document root `/home/c/cf86083/FPgroup/public_html` and showed successful installation of release `d797472` through Timeweb's web SSH console. Direct SSH from the execution environment has not connected. The new SEO release below has not yet been installed on Timeweb.

`public/downloads/install-fp-timeweb.sh` installs reviewed release `6aefdc1`. The archive SHA-256 is `2ee49a9a108c39029ee12a3347431ae366e7b14aeacea567c5d3021df3dc61e5`. Download the installer using its immutable Git commit URL, verify its own published hash, and run it with the document-root path as its only argument.

Archive: https://raw.githubusercontent.com/thekingooo/site/6aefdc1/public/downloads/fp-group-evercoat.zip

This release adds the selected title/favicon, canonical URL, search description, structured company data, robots.txt, sitemap.xml and link previews. The existing service label becomes a stable H1. Before/after screenshots show identical pixels at the verified desktop and mobile widths. See `docs/fp-seo-review.md` for scope and checks.

The installer requires an existing, writable `public_html` directory, rejects a symlink document root, downloads and verifies the archive, and extracts it into a temporary sibling directory. Existing `.well-known` certificate-validation files are retained. The complete previous document root is moved into a private sibling directory named `.fp-backup.XXXXXXXX/public_html`, and the prepared site becomes the document root. A failed activation restores the previous root if the target is absent. Temporary download/extraction files are removed on exit. The installer prints the backup path on success; retain it for recovery. Existing application configuration such as `.htaccess` stays with the previous site in the backup.

The installation is separate from domain binding and HTTPS setup in Timeweb. After the user runs the command, inspect the output and verify the site using the technical address or assigned domain. The current form still prepares a mailto message; server-side delivery through Yandex SMTP has not been implemented or configured.

The SEO files use `https://fp-group.su/` as the primary URL. Verify that URL, `/robots.txt`, `/sitemap.xml` and `/assets/social-preview.jpg` after installation. HTTPS and www/non-www redirects belong in the hosting configuration; the archive does not introduce an unverified `.htaccess`. Search Console, Yandex Webmaster and analytics require the owner's account setup.

Local verification covers successful installation with byte-identical backup, preservation of certificate-validation files, permissions (public directory 755, files 644, backup directory 700), checksum failure leaving the existing site untouched, activation failure or a hangup signal restoring it, and refusal of a symlink document root. Evidence is in `/workspace/artifacts/fp-timeweb-deploy/`.
