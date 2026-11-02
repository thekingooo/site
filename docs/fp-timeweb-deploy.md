# FP Group: installation through the Timeweb SSH console

The user confirmed an existing `public_html` document root in the hosting account on 2 November 2026. Direct SSH from the execution environment has not connected; the hosting account's web SSH console is available. No remote files have been changed by the assistant.

`public/downloads/install-fp-timeweb.sh` installs reviewed release `d797472`. The archive SHA-256 is `827e296bb7c063df168358ab6b670c15f92f221f06b920c61c748e0d388fbdfc`. Download the installer using its immutable Git commit URL, verify its own published hash, and run it with the document-root path as its only argument.

The installer requires an existing, writable `public_html` directory, rejects a symlink document root, downloads and verifies the archive, and extracts it into a temporary sibling directory. Existing `.well-known` certificate-validation files are retained. The complete previous document root is moved into a private sibling directory named `.fp-backup.XXXXXXXX/public_html`, and the prepared site becomes the document root. A failed activation restores the previous root if the target is absent. Temporary download/extraction files are removed on exit. The installer prints the backup path on success; retain it for recovery. Existing application configuration such as `.htaccess` stays with the previous site in the backup.

The installation is separate from domain binding and HTTPS setup in Timeweb. After the user runs the command, inspect the output and verify the site using the technical address or assigned domain. The current form still prepares a mailto message; server-side delivery through Yandex SMTP has not been implemented or configured.

Local verification covers successful installation with byte-identical backup, preservation of certificate-validation files, permissions (public directory 755, files 644, backup directory 700), checksum failure leaving the existing site untouched, activation failure or a hangup signal restoring it, and refusal of a symlink document root. Evidence is in `/workspace/artifacts/fp-timeweb-deploy/`.
