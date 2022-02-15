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

import { GbRom } from "./rom";

const WORK_RAM_BANK_SIZE = 4096;
const EXTERNAL_RAM_BANK_SIZE = 8192;

/*
 * Credit: https://www.chibiakumas.com/z80/Gameboy.php
 *
 * 0000 	3FFF 	16KB ROM Bank 00 (in cartridge, fixed at bank 00)
 * 4000  	7FFF 	16KB ROM Bank 01..NN (in cartridge, switchable bank number)
 * 8000 	8FFF 	VRAM: Tiles / Sprites
 * 9000 	97FF 	VRAM: Tiles Alt
 * 9800 	9BFF 	VRAM: Tilemap 1
 * 9C00 	9FFF 	VRAM: Tilemap 2
 * A000 	BFFF 	8KB External RAM (in cartridge, switchable bank, if any)
 * C000 	CFFF 	4KB Work RAM Bank 0 (WRAM)
 * D000 	DFFF 	4KB Work RAM Bank 1 (WRAM) (switchable bank 1-7 in CGB Mode)
 * E000 	FDFF 	Same as C000-DDFF (ECHO) (typically not used)
 * FE00 	FE9F 	Sprite Attribute Table (OAM) (Can�t change during screen redraw)
 * FEA0 	FEFF 	Not Usable
 * FF00 	FF7F 	I/O Ports
 * FF80 	FFFE 	High RAM (HRAM) (Stack)
 * FFFF 	FFFF 	Interrupt Enable Register
 */

enum WriteMode {
  ReadOnly,
  Writable,
}

/**
 * Implements the mapped memory of the Gameboy.
 */
export class Memory {
  romBank0: DataView;
  romBank1: DataView;
  romBank2: DataView;
  romBank3: DataView;

  workRom0: DataView;
  workRom1: DataView;

  memBank0 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);
  memBank1 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);
  memBank2 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);
  memBank3 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);
  memBank4 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);
  memBank5 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);
  memBank6 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);
  memBank7 = new DataView(new Uint8Array(WORK_RAM_BANK_SIZE).buffer);

  workRam0: DataView = this.memBank0;
  workRam1: DataView = this.memBank1;

  tiles0 = new DataView(new Uint8Array(0x9000 - 0x8000));
  tiles1 = new DataView(new Uint8Array(0x9800 - 0x9000));

  tileMap0 = new DataView(new Uint8Array(0x9c00 - 0x9800));
  tileMap1 = new DataView(new Uint8Array(0xa000 - 0x9c00));

  // TODO: I believe this is swappable. Refine later.
  externalRam = new DataView(new Uint8Array(EXTERNAL_RAM_BANK_SIZE).buffer);

  spriteAttributeTable = new DataView(new Uint8Array(0xfea0 - 0xfe00));

  constructor(rom: GbRom) {
    this.romBank0 = new DataView(rom.data.buffer, 0x0, 0x4000);
    this.romBank1 = new DataView(rom.data.buffer, 0x4000, 0x8000);
    this.romBank2 = new DataView(rom.data.buffer, 0x8000, 0xc000);
    this.romBank3 = new DataView(rom.data.buffer, 0xc000, 0x10000);

    this.workRom0 = this.romBank0;
    this.workRom1 = this.romBank1;
  }

  map(addr: number): [DataView, number, WriteMode] {
    if (addr >= 0x0 && addr <= 0x3fff) {
      return [this.workRom0, addr, WriteMode.ReadOnly];
    } else if (addr >= 0x4000 && addr <= 0x7fff) {
      return [this.workRom1, addr - 0x4000, WriteMode.ReadOnly];
    } else if (addr >= 0x8000 && addr <= 0x8fff) {
      return [this.tiles0, addr - 0x8000, WriteMode.Writable];
    } else if (addr >= 0x9000 && addr <= 0x97ff) {
      return [this.tiles1, addr - 0x9000, WriteMode.Writable];
    } else if (addr >= 0x9800 && addr <= 0x9bff) {
      return [this.tileMap0, addr - 0x9800, WriteMode.Writable];
    } else if (addr >= 0x9c00 && addr <= 0x9fff) {
      return [this.tileMap1, addr - 0x9c00, WriteMode.Writable];
    } else if (addr >= 0xa000 && addr <= 0xbfff) {
      return [this.externalRam, addr - 0xa000, WriteMode.Writable];
    } else if (addr >= 0xc000 && addr <= 0xcfff) {
      return [this.workRam0, addr - 0xc000, WriteMode.Writable];
    } else if (addr >= 0xd000 && addr <= 0xdfff) {
      return [this.workRam1, addr - 0xd000, WriteMode.Writable];
    } else if (addr >= 0xe000 && addr <= 0xfdff) {
      return this.map(addr - 0x2000);
    } else if (addr >= 0xfe00 && addr <= 0xfe9f) {
      // TODO: Toggle write mode based on screen redraw state.
      return [this.spriteAttributeTable, addr - 0xfe00, WriteMode.Writable];
    } else if (addr >= 0xfea0 && addr <= 0xfeff) {
      throw new Error(`Unhandled (not usable) address ${addr}.`);
    } else if (addr >= 0xff00 && addr <= 0xff7f) {
      throw new Error(`Unhandled (I/O) address ${addr}.`);
    } else if (addr >= 0xff80 && addr <= 0xfffe) {
      throw new Error(`Unhandled (HRAM) address ${addr}.`);
    } else if (addr === 0xffff) {
      throw new Error(`Unhandled (Interrupt Enable Register) address ${addr}.`);
    } else {
      throw new Error(
        `Attempted to fetch un-mappable address ${addr} from memory.`
      );
    }
  }

  readUint8(addr: number): number {
    return 0;
  }
}
