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

import { Memory } from "./memory";

/*
 * Flags Register Breakdown:
 * https://gbdev.io/pandocs/CPU_Registers_and_Flags.html#the-flags-register-lower-8-bits-of-af-register
 *
 * Bit	Name	Explanation
 * 7	  z	    Zero flag
 * 6	  n	    Subtraction flag (BCD)
 * 5	  h	    Half Carry flag (BCD)
 * 4	  c	    Carry flag
 */

const ZERO = 0b01000000;
const SUBTRACT = 0b00100000;
const HALF_CARRY = 0b00010000;
const CARRY = 0b00001000;

export class SharpLR35902 {
  memory: Memory;

  /*
   * Registers: https://gbdev.io/pandocs/CPU_Registers_and_Flags.html#registers
   *
   * 16-bit	Hi	Lo	Name/Function
   * AF	    A   -   Accumulator & Flags
   * BC	    B   C   BC
   * DE	    D   E   DE
   * HL	    H   L   HL
   * SP	    -	  -	  Stack Pointer
   * PC	    -	  -	  Program Counter/Pointer
   */

  af = 0;
  bc = 0;
  de = 0;
  hl = 0;
  sp = 0;
  pc = 0;

  get zero() {
    return (this.f & ZERO) > 0;
  }
  set zero(value: boolean) {
    if (value) this.f = this.f | ZERO;
    else this.f = this.f & (~ZERO & 0xff);
  }

  get subtract() {
    return (this.f & ZERO) > 0;
  }
  set subtract(value: boolean) {
    if (value) this.f = this.f | SUBTRACT;
    else this.f = this.f & (~SUBTRACT & 0xff);
  }

  get halfCarry() {
    return (this.f & HALF_CARRY) > 0;
  }
  set halfCarry(value: boolean) {
    if (value) this.f = this.f | HALF_CARRY;
    else this.f = this.f & (~HALF_CARRY & 0xff);
  }

  get carry() {
    return (this.f & CARRY) > 0;
  }
  set carry(value: boolean) {
    if (value) this.f = this.f | CARRY;
    else this.f = this.f & (~CARRY & 0xff);
  }

  get a() {
    return this.af & 0xff00;
  }
  set a(value: number) {
    this.af = (value << 8) | (this.af & 0x00ff);
  }

  get f() {
    return this.af & 0x00ff;
  }
  set f(value: number) {
    this.af = value | (this.af & 0xff00);
  }

  get b() {
    return this.bc & 0xff00;
  }
  set b(value: number) {
    this.bc = (value << 8) | (this.bc & 0x00ff);
  }

  get c() {
    return this.bc & 0x00ff;
  }
  set c(value: number) {
    this.bc = value | (this.bc & 0xff00);
  }

  get d() {
    return this.de & 0xff00;
  }
  set d(value: number) {
    this.de = (value << 8) | (this.de & 0x00ff);
  }

  get e() {
    return this.de & 0x00ff;
  }
  set e(value: number) {
    this.de = value | (this.de & 0xff00);
  }

  get h() {
    return this.hl & 0xff00;
  }
  set h(value: number) {
    this.hl = (value << 8) | (this.hl & 0x00ff);
  }

  get l() {
    return this.hl & 0x00ff;
  }
  set l(value: number) {
    this.hl = value | (this.hl & 0xff00);
  }

  constructor(memory: Memory) {
    this.memory = memory;
  }

  /**
   * Executes a single instruction, which may take multiple cycles.
   * @param addr
   * @returns the number of clock cycles that have been completed
   */
  step(addr: number): number {
    const opcode = this.memory.readUint8(addr);

    switch (opcode) {
      default:
        throw new Error(`Encountered undefined opcode '${opcode}', stopping!`);
    }
  }

  /**
   * Returns the mnemonic representation for an instruction.
   * @param addr
   * @returns a human-readable string detailing the instruction
   */
  mnemonic(addr: number): string {
    const opcode = this.memory.readUint8(addr);

    switch (opcode) {
      default:
        throw new Error(`Encountered undefined opcode '${opcode}', stopping!`);
    }
  }
}
