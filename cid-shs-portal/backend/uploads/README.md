Place your PDF files in this folder to make them available to the backend.

- Example: dm106.pdf

The server serves files statically at `/uploads/<filename>` and provides a listing at `/api/uploads`.

For security, avoid placing any executable or sensitive files here. Configure web server permissions as needed for production.
