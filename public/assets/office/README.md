# Office Tileset Assets

This directory holds the **LimeZu Modern Office** tileset files (not included in the repo).

## The game works without these

Fallback rendering (procedural sprites + colored rectangles) kicks in automatically.
The premium tileset provides the polished pixel-art look.

## How to install

Run the setup script:

```
./scripts/setup-assets.sh
```

Or manually:

1. Purchase "Modern Office - Revamped" ($1.20) from [LimeZu on itch.io](https://limezu.itch.io/modernoffice)
2. Extract and copy files:

```
cp -r /path/to/Modern_Office_Revamped_v1.2 ../Modern_Office_Revamped_v1.2/
cp Modern_Office_Revamped_v1.2/1_Room_Builder_Office/Room_Builder_Office_16x16.png room-builder.png
cp Modern_Office_Revamped_v1.2/2_Modern_Office_Black_Shadow/Modern_Office_Black_Shadow.png furniture.png
```

## Sheet specs

- **furniture.png**: 256x848, 16x53 grid of 16px tiles
- **room-builder.png**: 256x224, 16x14 grid of 16px tiles
