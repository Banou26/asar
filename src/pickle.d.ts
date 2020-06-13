/// <reference types="node" />
import { Buffer } from 'buffer';
export declare const SIZE_INT32 = 4;
export declare const SIZE_UINT32 = 4;
export declare const SIZE_INT64 = 8;
export declare const SIZE_UINT64 = 8;
export declare const SIZE_FLOAT = 4;
export declare const SIZE_DOUBLE = 8;
export declare const PAYLOAD_UNIT = 64;
export declare const CAPACITY_READ_ONLY = 9007199254740992;
export declare const alignInt: (i: number, alignment: number) => number;
declare class PickleIterator {
    payload: any;
    payloadOffset: number;
    readIndex: number;
    endIndex: number;
    constructor(pickle: Pickle);
    readBool(): boolean;
    readInt(): any;
    readUInt32(): any;
    readInt64(): void;
    readUInt64(): void;
    readFloat(): any;
    readDouble(): any;
    readString(): any;
    readBytes(length: number, method?: Function): any;
    getReadPayloadOffsetAndAdvance(length: number): number;
    advance(size: number): void;
}
export default class Pickle {
    header: Buffer;
    headerSize: number;
    capacityAfterHeader: number;
    writeOffset: number;
    constructor(buffer?: Buffer);
    createIterator(): PickleIterator;
    toBuffer(): Buffer;
    writeBool(value: any): boolean;
    writeInt(value: any): boolean;
    writeUInt32(value: any): boolean;
    writeInt64(): void;
    writeUInt64(): void;
    writeFloat(value: any): boolean;
    writeDouble(value: any): boolean;
    writeString(value: string): boolean;
    setPayloadSize(payloadSize: number): number;
    getPayloadSize(): number;
    writeBytes(data: any, length: number, method?: Function): boolean;
    resize(newCapacity: number): void;
}
export declare const createEmpty: () => Pickle;
export declare const createFromBuffer: (buffer: Buffer) => Pickle;
export {};
