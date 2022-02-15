/*
 * Copyright (C) 2022 Jamie Kuppens
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as fs from "fs/promises";

const ROM_MAX_SIZE = 65536;

/*
 * Credit: https://www.chibiakumas.com/z80/Gameboy.php
 *
 * 0000 	0007 	Z80 RST0
 * 0008 	000F 	Z80 RST1
 * 0010 	0017 	Z80 RST2
 * 0018 	001F 	Z80 RST3
 * 0020 	0027 	Z80 RST4
 * 0028 	002F 	Z80 RST5
 * 0030 	0037 	Z80 RST6
 * 0038 	003F 	Z80 RST7
 * 0040 	0047 	Interrupt:Vblank
 * 0048 	004F 	Interrupt:LCD-Stat
 * 0050 	0057 	Interrupt:Timer
 * 0058 	005F 	Interrupt:Serial
 * 0060 	0067 	Interrupt:Joypad
 * 0068 	00FF 	unused
 * 0100 	0103 	Entry point (start of program)
 * 0104 	0133 	Nintendo logo (must match rom logo)
 * 0134 	0142 	Game Name (Uppercase)
 * 0143 	0143 	Color gameboy flag (&80 = GB+CGB,&C0 = CGB only)
 * 0144 	0145 	Game Manufacturer code
 * 0146 	0146 	Super GameBoy flag (&00=normal, &03=SGB)
 * 0147 	0147 	Cartridge type (special upgrade hardware) (0=normal ROM)
 * 0148 	0148 	Rom size (0=32k, 1=64k,2=128k etc)
 * 0149 	0149 	Cart Ram size (0=none,1=2k 2=8k, 3=32k)
 * 014A 	014A 	Destination Code (0=JPN 1=EU/US)
 * 014B 	014B 	Old Licensee code (must be &33 for SGB)
 * 014C 	014C 	Rom Version Number (usually 0)
 * 014D 	014D 	Header Checksum - �ones complement� checksum of bytes 0134-014C
 * not needed for emulators
 * 014E 	014F 	Global Checksum � 16 bit sum of all rom bytes (except 014E-014F)
 * unused by gameboy
 * 0150 	� 	Game Code!
 */

enum ColorCompatibility {
  All = 0x80,
  ColorOnly = 0xc0,
}

enum SuperGameBoyFlag {
  Normal = 0x0,
  Sgb = 0x3,
}

enum CartridgeType {
  Normal = 0,
}

enum DestinationCode {
  Japan = 0x0,
  EuropeAndUnitedStates = 0x1,
}

/**
 * GbRom parses Gameboy ROM dumps into a usable object.
 */
export class GbRom {
  rst: DataView;
  interrupts: DataView;
  entryPoint: DataView;
  logo: DataView;
  gameName: string;
  color: ColorCompatibility;
  manufacturerCode: number;
  superGameBoyFlag: SuperGameBoyFlag;
  cartridgeType: CartridgeType;
  romSize: number;
  cartRamSize: number;
  destinationCode: DestinationCode;
  licenseeCode: number;
  versionNumber: number;
  headerChecksum: number;
  globalChecksum: number;
  data: Uint8Array;

  constructor(rom: Uint8Array) {
    const view = new DataView(rom.buffer, 0, ROM_MAX_SIZE);

    this.rst = new DataView(rom.buffer, 0x0, 0x40);
    this.interrupts = new DataView(rom.buffer, 0x40, 0x68 - 0x40);
    this.entryPoint = new DataView(rom.buffer, 0x100, 0x104 - 0x100);
    this.logo = new DataView(rom.buffer, 0x104, 0x134 - 0x104);

    this.gameName = Array.from(new Uint8Array(rom.slice(0x134, 0x143)))
      .filter((char) => char !== 0)
      .map((char) => String.fromCharCode(char))
      .join("");

    this.color = view.getUint8(0x143);
    this.manufacturerCode = view.getUint16(0x144, true);
    this.superGameBoyFlag = view.getUint8(0x146);
    this.cartridgeType = view.getUint8(0x147);
    this.romSize = (view.getUint8(0x148) + 1) * 32768;

    const cartRamSize = view.getUint8(0x149);
    if (cartRamSize === 1) this.cartRamSize = 2048;
    else if (cartRamSize === 2) this.cartRamSize = 8192;
    else if (cartRamSize === 3) this.cartRamSize = 32768;
    else this.cartRamSize = 0;

    this.destinationCode = view.getUint8(0x14a);
    this.licenseeCode = view.getUint8(0x14b);
    this.versionNumber = view.getUint8(0x14c);
    this.headerChecksum = view.getUint8(0x14d);
    this.globalChecksum = view.getUint16(0x14e, true);

    this.data = rom;
  }

  /**
   * Reads the contents of a Gameboy ROM dump into a GbRom object.
   * @param filepath where the ROM lives in the filesystem
   * @returns a GbRom object
   */
  static async fromFilesystem(filepath: string): Promise<GbRom> {
    const buf = await fs.readFile(filepath, { flag: "r" });
    if (buf.byteLength > ROM_MAX_SIZE) {
      throw new Error(`ROM size exceeds ${ROM_MAX_SIZE} length limit.`);
    }

    const rom = new Uint8Array(ROM_MAX_SIZE);
    rom.set(buf, 0);
    return new GbRom(rom);
  }

  // TODO: Implement header and global checksum validation.
}
