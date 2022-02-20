import { Memory } from "./memory";
import { GbRom } from "./rom";

describe("memory", () => {
  let rom: GbRom, memory: Memory;

  beforeAll(async () => {
    rom = await GbRom.fromFilesystem("./data/cpu_instrs.gb");
  });

  beforeEach(() => {
    memory = new Memory(rom);
  });

  it("should be capable of manipulating uint8 values from ram", () => {
    let value: number;

    value = memory.readUint8(0xc000);
    expect(value).toBe(0);

    memory.writeUint8(0xc000, 0xff);
    value = memory.readUint8(0xc000);
    expect(value).toBe(0xff);
  });

  it("should be capable of manipulating uint16 values from ram", () => {
    let value: number;

    value = memory.readUint16LE(0xc000);
    expect(value).toBe(0);

    memory.writeUint16LE(0xc000, 0xaaff);
    value = memory.readUint16LE(0xc000);
    expect(value).toBe(0xaaff);
  });

  it("should write uint16 values as little-endian", () => {
    let value, low, high: number;

    value = memory.readUint16LE(0xc000);
    expect(value).toBe(0);

    memory.writeUint16LE(0xc000, 0xaaff);
    low = memory.readUint8(0xc000);
    high = memory.readUint8(0xc001);
    expect(low).toBe(0xff);
    expect(high).toBe(0xaa);
  });

  it("should not be able to write to rom (0x0000)", () => {
    let value: number;

    value = memory.readUint16LE(0x0);
    expect(value).not.toBe(0xbeef);

    memory.writeUint16LE(0x0, 0xbeef);
    value = memory.readUint16LE(0x0);
    expect(value).not.toBe(0xbeef);
  });

  it("should not be able to write to rom (0x7ffe)", () => {
    let value: number;

    value = memory.readUint16LE(0x7ffe);
    expect(value).not.toBe(0xbeef);

    memory.writeUint16LE(0x7ffe, 0xbeef);
    value = memory.readUint16LE(0x7ffe);
    expect(value).not.toBe(0xbeef);
  });

  it("should write half values at write boundary (0x7fff)", () => {
    let value: number;

    value = memory.readUint16LE(0x7fff);
    expect(value).not.toBe(0xbeef);

    memory.writeUint16LE(0x7fff, 0xbeef);
    value = memory.readUint16LE(0x7fff);
    expect(value).toBe(0xbe00);
  });
});
