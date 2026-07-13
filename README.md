# HEX CONQUEST

## Project Overview

Hex Conquest is a turn-based multiplayer strategy game built with:

* Phaser 3
* TypeScript
* Vite
* Capacitor Android
* FastAPI
* Docker

The game is inspired by Ataxx, Hexxagon, and Othello but uses a simplified hex-grid system designed for fast mobile matches.

Core design goals:

* Easy to learn
* Fast matches (2–5 minutes)
* Mobile-first
* Online multiplayer
* Simple to balance
* Expandable into campaign and competitive play

---

# Current Project Status

## Overall Progress

### Core Gameplay

Status: COMPLETE

### Android APK

Status: COMPLETE

### Online PvP

Status: COMPLETE (Phase 1)

### Campaign

Status: PLAYABLE

### AI Opponent

Status: PLAYABLE

### Local Multiplayer

Status: COMPLETE

---

# Technology Stack

Frontend

* Phaser 3
* TypeScript
* Vite

Mobile

* Capacitor Android

Backend

* FastAPI
* Docker Compose

Future

* PostgreSQL
* WebSockets
* Matchmaking
* Ranked Play

---

# Gameplay Rules

## Board

Current board:

* Hexagonal grid
* Radius = 4

Current size:

```typescript
BOARD_RADIUS = 4
HEX_SIZE = 27.5
```

Board centered on screen.

---

## Units

Each player controls soldiers.

### Blue

Asset:

```text
blue_01.png
```

### Red

Asset:

```text
red_01.png
```

Custom PNG assets now replace procedural soldier drawings.

---

## Movement

A turn allows:

```text
Move exactly 1 adjacent hex
```

Rules:

* Must move to adjacent empty hex
* Original hex becomes empty
* Cannot move through units
* Cannot move onto occupied hex

---

## Conversion Mechanic

Core mechanic:

When a unit moves into a hex:

```text
All adjacent enemy units become friendly units
```

Converted units:

* Immediately change ownership
* Change color
* Change sprite

---

## Victory Conditions

Player wins when:

### Elimination

```text
Opponent has zero units remaining
```

### No Legal Moves

```text
Opponent cannot make a move
```

Winner determined by:

```text
Remaining unit count
```

---

# Implemented Features

## Main Menu

Working.

Options:

* Campaign
* Play Against AI
* Local 2 Player
* Play Against Online Player

---

## Campaign Mode

Working.

Features:

* Level progression
* Increasing AI difficulty
* Retry level
* Next level

Current progression:

### Level 1–2

Standard board.

### Level 3+

Additional Red starting positions.

### Level 5+

Additional board variations.

---

## Play Against AI

Working.

Human:

```text
Blue
```

AI:

```text
Red
```

---

## AI System

Implemented.

AI evaluates:

```text
Enemy conversions
+
Center control
+
Random tie breaker
```

Formula:

```typescript
score =
    converted * 100
    + centerBonus
    + randomBonus
```

AI behavior:

* Highlights move
* Simulates thinking delay
* Executes best move

---

## Local Multiplayer

Working.

Features:

* Two players
* Same device
* Turn-based

No AI.

---

# Move Preview System

Implemented.

When selecting a unit:

* Legal moves highlighted
* Conversion count shown

Example:

```text
+1
+2
+3
```

Animated preview labels.

---

# Android Support

Status: COMPLETE

Framework:

```text
Capacitor
```

APK generation working.

---

## Android Fixes Completed

### PNG Asset Loading

Fixed.

Assets load correctly on Android.

---

### Fullscreen Scaling

Working.

---

### Touch Input

Working.

---

### HTTP Networking

Fixed.

Issue:

```text
Mixed Content
```

Error:

```text
https://localhost
→
http://192.168.x.x:8000
```

Android WebView blocked requests.

Solution:

capacitor.config.ts

```typescript
server: {
  androidScheme: 'http',
  cleartext: true
}
```

AndroidManifest.xml

```xml
android:usesCleartextTraffic="true"
```

Result:

Android APK can now communicate with PvP backend.

---

# Online PvP

Status: WORKING

---

## Backend

Technology:

* FastAPI
* Docker Compose

Deployment:

```bash
docker compose up -d
```

---

## PvP Architecture

Client

```text
Phaser
↓
Capacitor APK
```

Backend

```text
FastAPI
↓
In-memory room storage
```

Communication

```text
HTTP Polling
```

Current polling interval:

```text
2.2 seconds
```

---

## Online Features

Implemented:

### Create Room

Player creates:

```text
ABCDE
```

style room code.

---

### Join Room

Player enters room code.

---

### Turn Validation

Server validates:

* Current player
* Adjacent move
* Empty target hex
* Legal ownership

---

### State Synchronization

Server provides:

```json
room_state
```

containing:

* board
* current player
* turn
* winner
* scores

---

### Victory Synchronization

Working.

Both players receive:

```text
Winner
Final Score
```

---

# PvP Bug Fixes Completed

## Polling Overwrite Bug

Issue:

```text
Player had to move quickly
otherwise polling reset selection
```

Cause:

Old polling response overwrote local interaction.

Solution:

Added:

```typescript
onlineSubmittingMove
```

Polling now pauses during:

* Selection
* Move submission

Stale state updates ignored.

Result:

Stable online gameplay.

---

## Android Connectivity Bug

Issue:

```text
Browser worked
APK failed
```

Root cause:

```text
Mixed Content Security
```

Solution:

Capacitor cleartext configuration.

Result:

APK successfully connects to:

http://hex-conquest-pvp-alb-1620546806.ap-southeast-2.elb.amazonaws.com

---

# Current Folder Structure

Frontend

```text
src/
  main.ts
  public/
    assets/
      blue_01.png
      red_01.png
```

Backend

```text
docker-compose.yml

app/
  main.py
  requirements.txt
  Dockerfile
```

---

# Current Backend API

Create Room

```http
POST /rooms/create
```

Join Room

```http
POST /rooms/join
```

State

```http
GET /rooms/{room}/state
```

Move

```http
POST /rooms/{room}/move
```

Health

```http
GET /health
```

---

# Recommended Next Development Tasks

Priority 1

## Reconnection Support

Save:

```typescript
playerId
roomCode
playerColor
```

using:

```typescript
localStorage
```

Auto reconnect after:

* App restart
* APK crash
* Accidental close

---

Priority 2

## Room Cleanup

Current:

```text
Rooms live forever
```

Add:

```python
ROOM_TIMEOUT = 3600
```

Cleanup inactive rooms.

---

Priority 3

## Sound Effects

Add:

```text
select.wav
move.wav
convert.wav
victory.wav
```

---

Priority 4

## Better Animations

Current:

```text
Instant movement
```

Desired:

```text
Tween movement
```

---

Priority 5

## Campaign Expansion

Target:

```text
20+ Levels
```

Add:

* Special layouts
* Objectives
* Stronger AI

---

Priority 6

## Persistent Backend

Current:

```text
In-memory storage
```

Move to:

```text
PostgreSQL
```

Benefits:

* Reconnection
* Match history
* Rankings

---

Priority 7

## WebSocket Upgrade

Current:

```text
Polling
```

Future:

```text
WebSocket
```

Benefits:

* Instant turns
* Less traffic
* Better UX

---

Priority 8

## Ranked Multiplayer

Future:

* Matchmaking
* Elo rating
* Seasons
* Leaderboards

---

# Current State Summary

The game is now fully playable in:

* Campaign Mode
* Play Against AI
* Local 2 Player
* Online PvP

The Android APK works.

The Docker PvP backend works.

Players can create rooms, join rooms, and complete online matches.

The next major milestone is:

```text
Reconnect Support + Persistent Backend
```

followed by:

```text
Closed Beta Testing
```
