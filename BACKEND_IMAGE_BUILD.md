## Backend Docker Image Build & GHCR Push

This backend includes a helper script to build a Docker image using `docker buildx` and optionally push it to a registry such as GitHub Container Registry (GHCR).

### Script: `backend/build-image.sh`

**Usage:**

```bash
./backend/build-image.sh [PLATFORM] [REGISTRY] [PUSH]
```

- **PLATFORM**: Target platform(s) for buildx (default: `linux/amd64`)
  - Examples: `linux/amd64`, `linux/amd64,linux/arm64`
- **REGISTRY**: Registry prefix for the image tag (default: empty = local only)
  - Example: `ghcr.io/YOUR_GITHUB_USERNAME`
- **PUSH**: Whether to push to the registry (`true` or `false`, default: `false`)
  - When `PUSH=true`, `REGISTRY` is required.

The image name and tag can be customized via environment variables:

- `BACKEND_IMAGE_NAME` (default: `workflow-canvas-backend`)
- `BACKEND_IMAGE_TAG` (default: `latest`)

### Local build only (no registry push)

If you just need a local image for development (no GHCR interaction), run:

```bash
cd backend
./build-image.sh
```

This builds `workflow-canvas-backend:latest` locally using `docker buildx build --load`.

### Build and push to GHCR

To push the image to GHCR (for example, to `ghcr.io/khoa0702/workflow-canvas-backend:latest`), you must:

1. **Create a GitHub token** with at least:
   - `read:packages`
   - `write:packages`
   - (optional) `delete:packages` if you plan to delete images

2. **Log in to GHCR** on your machine so Docker can authenticate:

```bash
export GHCR_PAT=YOUR_GITHUB_TOKEN
echo "$GHCR_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

3. **Run the build script with registry and push enabled:**

```bash
cd backend
./build-image.sh linux/amd64 ghcr.io/YOUR_GITHUB_USERNAME true
```

This will build and push the image to:

```text
ghcr.io/YOUR_GITHUB_USERNAME/workflow-canvas-backend:latest
```

### Notes on 403 errors from GHCR

If you see an error like:

```text
failed to fetch anonymous token: unexpected status from GET request to https://ghcr.io/token?...: 403 Forbidden
```

it usually means:

- Docker is trying to access GHCR **without credentials**, and
- The repository or requested scopes (`pull,push`) **require authentication**.

Fix it by ensuring you have:

- Logged in to `ghcr.io` with a token that has `read:packages` and `write:packages`
- Used the correct namespace in `REGISTRY` (for example, `ghcr.io/khoa0702`)

