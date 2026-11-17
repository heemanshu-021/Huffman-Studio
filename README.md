# Huffman Studio

A full-stack, university-level text compression suite powered by an authentic **Java 21** implementation of the **Huffman Coding Algorithm** and an interactive **React + TypeScript + Tailwind CSS** frontend.

---

## Table of Contents

- [Overview](#overview)
- [Key Features & Capabilities](#key-features--capabilities)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Applications](#running-the-applications)
- [API Documentation](#api-documentation)
- [Development Roadmap](#development-roadmap)
- [License](#license)

---

## Overview

**Huffman Studio** is designed as a rigorous educational and production-grade demonstration of **Greedy Prefix Coding**. Unlike trivial demonstrations, Huffman Studio features:

* **True Bit-Level Compression**: Implements bit-packing streams in pure Java that convert variable-length prefix codes into compact 8-bit byte arrays.
* **Autonomous `.huf` Binary Container**: Generates self-contained archive files embedding serialized tree structures/frequency headers for independent decompression across restarts.
* **Decoupled Client-Server Model**: High-performance Java 21 Spring Boot backend orchestrating algorithm operations, connected via RESTful JSON and streaming APIs to a reactive TypeScript/Tailwind frontend.
* **Interactive Visualizations**: Interactive tree exploration and frequency metrics designed for academic evaluation and viva presentations.

---

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v7)
- **Icons**: Lucide React
- **Data Visualization**: Recharts

### Backend
- **Runtime**: Java 21 (OpenJDK 21 LTS)
- **Framework**: Spring Boot 3
- **Build & Dependency Management**: Apache Maven & Maven Wrapper (`./mvnw`)
- **Web & Validation**: Spring Web MVC, Jakarta Bean Validation
- **Testing**: JUnit 5, Spring Boot Test, AssertJ

---

## Project Structure

```
Huffman-Studio/
├── backend/                        # Java 21 Spring Boot Backend
│   ├── .mvn/                       # Maven Wrapper files
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/huffmanstudio/
│   │   │   │   ├── HuffmanStudioApplication.java
│   │   │   │   ├── algorithm/      # Core Huffman coding engine (Phase 2)
│   │   │   │   ├── archive/        # Real binary .huf compression & archive I/O (Phase 3)
│   │   │   │   ├── config/         # CORS and web configuration
│   │   │   │   ├── controller/     # REST controllers (Health, Compress, etc.)
│   │   │   │   ├── dto/            # Data transfer contracts
│   │   │   │   ├── exception/      # Centralized exception handling
│   │   │   │   ├── model/          # HuffmanNode, HuffmanTree domain models & stats
│   │   │   │   └── service/        # Business logic orchestration
│   │   │   └── resources/
│   │   │       └── application.yml # Spring Boot configuration
│   │   └── test/                   # JUnit 5 integration & unit tests
│   ├── mvnw                        # Unix Maven Wrapper script
│   ├── mvnw.cmd                    # Windows Maven Wrapper script
│   └── pom.xml                     # Maven project definition
├── frontend/                       # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── assets/                 # Brand assets and SVG icons
│   │   ├── components/             # Reusable UI components (Navbar, Cards, Badges)
│   │   ├── hooks/                  # Custom hooks (e.g., useHealthCheck)
│   │   ├── layouts/                # Main application layout and navigation
│   │   ├── pages/                  # Route views (Dashboard, Compressor, etc.)
│   │   ├── services/               # Centralized HTTP API client
│   │   ├── types/                  # Shared TypeScript interfaces
│   │   ├── utils/                  # Helper utilities and formatters
│   │   ├── App.tsx                 # Route hierarchy
│   │   ├── index.css               # Tailwind CSS setup
│   │   └── main.tsx                # React root mount
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Frontend dependencies and scripts
│   ├── tsconfig.json               # TypeScript compiler options
│   └── vite.config.ts              # Vite bundler configuration
├── docs/                           # Architectural & Phase Documentation
│   ├── API-REFERENCE.md            # REST API reference and cURL examples (Phase 4)
│   ├── ARCHITECTURE.md             # Layer responsibilities and archive spec
│   ├── HUF-ARCHIVE-FORMAT.md       # Binary .huf format specification (Phase 3)
│   ├── HUFFMAN-ALGORITHM.md        # Huffman algorithm deep-dive (Phase 2)
│   └── PHASES.md                   # Systematic engineering roadmap
├── .gitignore                      # Multi-tier gitignore rules
└── README.md                       # Main project documentation
```

---

## Prerequisites

Before running Huffman Studio, ensure you have the following installed on your system:

1. **Java Development Kit (JDK) 21**:
   - Check version: `java -version`
   - Target version: OpenJDK 21 LTS
   - If using Homebrew on macOS:
     ```bash
     export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
     export PATH="$JAVA_HOME/bin:$PATH"
     ```
2. **Node.js & npm**:
   - Node.js 18+ (verified on Node 20+)
   - npm 9+
   - Check versions: `node -v` and `npm -v`

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/heemanshu-021/Huffman-Studio.git
cd Huffman-Studio
```

### 2. Backend Setup
Navigate to the backend directory and verify the Maven wrapper:
```bash
cd backend
./mvnw clean test
```

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

---

## Running the Applications

### Starting the Backend Server
From the `backend/` directory:
```bash
# Ensure JAVA_HOME points to Java 21
./mvnw spring-boot:run
```
The backend will launch at `http://localhost:8080`.

Verify health status:
```bash
curl http://localhost:8080/api/health
```
Expected response:
```json
{
  "status": "UP",
  "message": "Huffman Studio Backend is operational",
  "timestamp": "2026-11-17T22:30:00Z",
  "version": "1.0.0"
}
```

### Starting the Frontend Server
From the `frontend/` directory:
```bash
npm run dev
```
The frontend will launch at `http://localhost:5173`. Open your browser and navigate to this URL to view the live dashboard.

---

## API Documentation

For full details, headers, error responses, and cURL examples, see [docs/API-REFERENCE.md](docs/API-REFERENCE.md).

### Core Endpoints

| Method | Endpoint | Consumes | Produces | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | *None* | `application/json` | System health status & version probe |
| `POST` | `/api/compress` | `multipart/form-data` | `application/octet-stream` | Compresses `.txt` file into downloadable binary `.huf` with metrics in headers |
| `POST` | `/api/decompress` | `multipart/form-data` | `text/plain; charset=UTF-8` | Decompresses `.huf` archive into restored `.txt` text file |
| `POST` | `/api/analyze` | `application/json` \| `multipart/form-data` | `application/json` | Analyzes text or file for tree visualization, codes & frequencies |

---

## Development Roadmap

See [docs/PHASES.md](docs/PHASES.md), [docs/API-REFERENCE.md](docs/API-REFERENCE.md), [docs/HUF-ARCHIVE-FORMAT.md](docs/HUF-ARCHIVE-FORMAT.md), and [docs/HUFFMAN-ALGORITHM.md](docs/HUFFMAN-ALGORITHM.md) for full details:
- **Phase 1: Foundation and Architecture** *(Completed)*
- **Phase 2: Huffman Core Algorithm Engine** *(Completed)*
- **Phase 3: Archive Specification & Binary File I/O** *(Completed)*
- **Phase 4: RESTful API Layer & Spring Integration** *(Completed)*
- **Phase 5: Frontend Interactive Workflows & Full-Stack Integration** *(Completed)*
- **Phase 6: Tree Visualizer & Educational Walkthrough**
- **Phase 7: Testing, Benchmarking & Release Verification**

---

## License

This project is prepared for academic study and computer science university coursework.
