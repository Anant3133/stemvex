# Pix2Text OCR setup (HTTP service)

This guide shows how to run Pix2Text as an HTTP service for Stemvex OCR and how Stemvex should later point `MATH_OCR_ENDPOINT` to our adapter.

## Prerequisites

- Ubuntu 24
- Python 3.10+ with `pip`
- (GPU host) NVIDIA driver + CUDA toolkit compatible with your RTX 4050

## Install Pix2Text

Run the Pix2Text install commands exactly as documented:

```bash
pip install pix2text
pip install pix2text[serve]
```

## Start the HTTP service

### GPU host (RTX 4050 example)

```bash
p2t serve -l en,ch_sim -a mfd -d cuda:0
```

### CPU-only teammate

```bash
p2t serve -l en,ch_sim -a mfd
```

### Host/port flags

Use `-H` to set host and `-p` to set port. Example:

```bash
p2t serve -l en,ch_sim -a mfd -H 0.0.0.0 -p 8503
```

## Test the service

Use multipart form fields `image_type=mixed` and `resized_shape=768`:

```bash
curl -X POST \
  -F image=@/path/to/sample.png \
  -F image_type=mixed \
  -F resized_shape=768 \
  http://0.0.0.0:8503/pix2text
```

## LAN mode (teammates on the same network)

Host runs Pix2Text with `-H 0.0.0.0`:

```bash
p2t serve -l en,ch_sim -a mfd -H 0.0.0.0 -p 8503
```

Teammates call it via:

```
http://<host-ip>:8503/pix2text
```

## Stemvex integration note

When our adapter is ready, set `MATH_OCR_ENDPOINT` to the adapter URL (not the Pix2Text URL directly). The adapter will forward requests to the Pix2Text service endpoint (e.g., `http://<host-ip>:8503/pix2text`).
