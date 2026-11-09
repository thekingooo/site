# FP Group: installation through the Timeweb SSH console

The user confirmed the document root `/home/c/cf86083/FPgroup/public_html` and confirmed successful installation of release `6149288` through Timeweb's web SSH console. Direct SSH from the execution environment has not connected. The 9 November spacing/map update below has not yet been installed on Timeweb.

`public/downloads/install-fp-timeweb.sh` installs reviewed release `2a019a4`. The archive SHA-256 is `27cf9fac2ca77269240f7fd71951455e185e0aaaf74700a2b28fcb49dda58ae5`. Download the installer using its immutable Git commit URL, verify its own published hash, and run it with the document-root path as its only argument.

Archive: https://raw.githubusercontent.com/thekingooo/site/2a019a4/public/downloads/fp-group-evercoat.zip

This release keeps the approved title/favicon and technical SEO for fp-group.su, matches section 05 spacing to the other sections without a scroll-height spacer, and animates the red Ufa marker with ripple rings. A static map is selected for reduced-motion preferences. Desktop/mobile layout, route gestures and animation checks passed; see `docs/fp-evercoat-preview.md`.

The installer requires an existing, writable `public_html` directory, rejects a symlink document root, downloads and verifies the archive, and extracts it into a temporary sibling directory. Existing `.well-known` certificate-validation files and `.htaccess` web-server configuration are retained in the new root, preserving hosting-managed HTTPS redirects. The complete previous document root is moved into a private sibling directory named `.fp-backup.XXXXXXXX/public_html`, and the prepared site becomes the document root. A failed activation restores the previous root if the target is absent. Temporary download/extraction files are removed on exit. The installer prints the backup path on success; retain it for recovery.

The installation is separate from domain binding and HTTPS setup in Timeweb. After the user runs the command, inspect the output and verify the site using the technical address or assigned domain. The current form still prepares a mailto message; server-side delivery through Yandex SMTP has not been implemented or configured.

The SEO files use `https://fp-group.su/` as the primary URL. Verify that URL, `/robots.txt`, `/sitemap.xml` and `/assets/social-preview.jpg` after installation. HTTPS and www/non-www redirects belong in the hosting configuration; the archive does not introduce an unverified `.htaccess`. Search Console, Yandex Webmaster and analytics require the owner's account setup.

Local verification covers successful installation with byte-identical backup, preservation of certificate-validation files, permissions (public directory 755, files 644, backup directory 700), checksum failure leaving the existing site untouched, activation failure or a hangup signal restoring it, and refusal of a symlink document root. Evidence is in `/workspace/artifacts/fp-timeweb-deploy/`.
