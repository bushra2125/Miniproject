# esp32/ — Future ESP32-CAM Integration

This folder is reserved for **ESP32-CAM** integration code and documentation.

The ESP32-CAM is a low-cost microcontroller with a built-in camera that can stream
live video over Wi-Fi. It will eventually capture fruit images automatically and send
them to the FruitQualityAI backend for analysis.

---

## Planned Integration Architecture

```
[ESP32-CAM]
     |
     | HTTP POST (multipart image)
     |
     v
[FruitQualityAI Backend]  →  [AI Model]  →  [Firestore]
     |
     v
[Frontend Dashboard]  ←  real-time inspection results
```

---

## What Will Go Here

| File / Folder | Purpose |
|---------------|---------|
| `firmware/`   | Arduino / ESP-IDF sketch for the ESP32-CAM |
| `docs/`       | Wiring diagrams, pin assignments, flashing guide |
| `test_stream.py` | Python script to test receiving frames from the camera |

---

## ESP32-CAM Setup (Future Steps)

1. **Hardware needed**
   - ESP32-CAM module (AI-Thinker or equivalent)
   - FTDI USB-to-Serial adapter (for flashing firmware)
   - 5V power supply (camera draws more current than USB alone)

2. **Software needed**
   - Arduino IDE with ESP32 board support installed
   - Or ESP-IDF (Espressif's official framework)

3. **Firmware plan**
   - Camera captures a frame on a set interval (or on button press)
   - Frame is sent as a multipart POST to `http://<your-server>/api/fruits/analyze`
   - Results are optionally displayed on a small OLED attached to the ESP32

4. **Backend changes needed**
   - The `/api/fruits/analyze` endpoint already accepts image uploads — no changes needed
   - Optionally add a `/api/stream` endpoint for continuous frame processing

---

## References

- [ESP32-CAM Getting Started (Random Nerd Tutorials)](https://randomnerdtutorials.com/esp32-cam-video-streaming-face-recognition-arduino-ide/)
- [ESP-IDF Documentation](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/index.html)
- [AI-Thinker ESP32-CAM Datasheet](https://github.com/raphaelbs/esp32-cam-ai-thinker)

---

*This folder will be populated in a future phase of the project.*
