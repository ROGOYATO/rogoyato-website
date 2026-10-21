# Compile server for the ROGOYATO Arduino simulator.
# Build:  docker build -t rogoyato-compile .
# Run:    docker run -p 8080:8080 rogoyato-compile
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ARG ARDUINO_CLI_VERSION=1.5.1
ADD https://downloads.arduino.cc/arduino-cli/arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz /tmp/arduino-cli.tar.gz
RUN tar -xzf /tmp/arduino-cli.tar.gz -C /usr/local/bin arduino-cli && rm /tmp/arduino-cli.tar.gz

# Toolchain and libraries are fixed at build time; students cannot install more.
ENV ARDUINO_DIRECTORIES_DATA=/opt/arduino/data \
    ARDUINO_DIRECTORIES_USER=/opt/arduino/user \
    ARDUINO_DIRECTORIES_DOWNLOADS=/tmp/arduino-downloads
RUN arduino-cli core update-index \
  && arduino-cli core install arduino:avr@1.8.8 \
  && arduino-cli lib install "Servo@1.3.0" "DHT sensor library@1.4.7" "Adafruit Unified Sensor@1.1.15" \
  && rm -rf /tmp/arduino-downloads

WORKDIR /app
COPY server.mjs ./
USER node

# Compile once so the Arduino core is already built when the first student asks.
RUN mkdir -p /tmp/warmup/sketch \
  && printf 'void setup(){}\nvoid loop(){}\n' > /tmp/warmup/sketch/sketch.ino \
  && arduino-cli compile --fqbn arduino:avr:uno /tmp/warmup/sketch \
  && rm -rf /tmp/warmup

ENV PORT=8080 NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.mjs"]
