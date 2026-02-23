# Web-Based Universal IC Tester

A full-stack, Web-Based Universal IC Tester built with a Raspberry Pi Pico and MCP23017 I/O expanders. It reimagines the classic, expensive digital IC tester as a modern, scalable hardware and software system featuring dynamic pin routing, truth-table verification, and a Web Serial API frontend.

## The Architecture: Brain vs. Muscle
This project splits the workload between a web browser and a microcontroller to overcome the storage and UI limitations of traditional embedded systems:
* **The Brain (Web Frontend):** A browser-based interface built with HTML/JS. It holds the infinitely expandable IC JSON database (truth tables, power pinouts) and handles the user interface.
* **The Muscle (Raspberry Pi Pico):** A "dumb" executor running MicroPython. It listens for JSON commands via USB serial, executes the raw I2C byte operations to the MCP23017 chips, and returns the physical logic results.

## Key Features
* **Universal Programmable Switching Matrix:** There is no fixed wiring for VCC or GND. The firmware dynamically configures any of the 40 ZIF socket pins as a Logic High, Logic Low, High-Z Input, or Power Supply based on the selected chip's footprint.
* **Web Serial API Integration:** Communicates directly with the Pico via USB serial directly from Google Chrome or Microsoft Edge. No standalone desktop apps or drivers required.
* **Truth Table Verification:** Injects test vectors (stimulus) into the IC and compares the physical logic responses against expected states.
* **Auto-Identify Mode:** Features a brute-force logic scanner that safely queries unknown chips against the database to automatically identify the component inserted into the socket.

## Hardware Requirements
* 1x Raspberry Pi Pico (MicroPython installed)
* 3x MCP23017 I2C I/O Expanders
* 1x 40-pin ZIF Socket (Zero Insertion Force)
* Digital Logic ICs for testing (e.g., 74LS00, 74LS08)
* Breadboard and Jumper Wires
* Logic Level: 3.3V (TTL Compatible)

## Pin Mapping & Wiring
The ZIF socket is bottom-justified and mapped across the three MCP23017 chips to support ICs ranging from 14-pin to 40-pin footprints. 

* **Top Chip (0x20):** Global Pins 0 - 15
* **Middle Chip (0x21):** Global Pins 16 - 31
* **Bottom Chip (0x22):** Global Pins 32 - 47
*(Example: A 14-pin IC placed at the bottom of the socket utilizes the GPA and GPB ports of the 0x22 chip).*

## How It Works (Theory of Operation)
1. **Safe Configuration:** All pins default to High-Impedance inputs to prevent shorts when an IC is inserted.
2. **Power Up:** The web frontend sends the IC's power footprint. The Pico drives the specific VCC pin HIGH and GND pin LOW.
3. **Vector Testing:** The Pico iterates through every possible input combination defined in the truth table, measuring the output pin.
4. **Conclusion:** If the physical logic matches the database exactly, a `PASS` signal is sent to the frontend UI. The IC is then safely powered down.

## Getting Started
1. Flash your Raspberry Pi Pico with the latest MicroPython firmware.
2. Upload the `main.py` serial listener script to the Pico.
3. Connect the Pico to your computer via USB.
4. Open `index.html` in a Web Serial API-compatible browser (Chrome/Edge).
5. Click "Connect", select your Pico's COM port, and insert an IC to begin testing!
