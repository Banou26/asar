var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import path from 'path';
import { Buffer } from 'buffer';
import { createFromBuffer } from './pickle';
import { isDirectoryMetadata } from './utils';
var searchNodeFromDirectory = function (header, p) {
    var json = header;
    var dirs = p.split(path.sep);
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
        var dir = dirs_1[_i];
        if (dir !== '.') {
            json = json.files[dir];
        }
    }
    return json;
};
var searchNodeFromPath = function (header, p) {
    p = path.relative('', p);
    if (!p) {
        return header;
    }
    var name = path.basename(p);
    var node = searchNodeFromDirectory(header, path.dirname(p));
    if (node.files === null) {
        node.files = {};
    }
    if (node.files[name] === null) {
        node.files[name] = {};
    }
    return node.files[name];
};
var readArchiveHeaderSync = function (archiveArrayBuffer) {
    // const view = new DataView(archiveArrayBuffer.slice(0, 8))
    // const size = view.getUint32(alignInt(4, SIZE_UINT32), true)
    var size = createFromBuffer(Buffer.from(archiveArrayBuffer.slice(0, 8)))
        .createIterator()
        .readUInt32();
    // todo: check if there is an easy way to replace Pickle with APIs like the DataView
    var header = createFromBuffer(Buffer.from(archiveArrayBuffer.slice(8, size + 8)))
        .createIterator()
        .readString();
    return {
        header: JSON.parse(header),
        headerSize: size
    };
};
var getArrayBuffer = function (data) { return new Blob([data]).arrayBuffer(); };
export var extractFile = function (archive, pathname) { return __awaiter(void 0, void 0, void 0, function () {
    var buffer, _a, header, headerSize, _b, offset, size;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, getArrayBuffer(archive)];
            case 1:
                buffer = _c.sent();
                _a = readArchiveHeaderSync(buffer), header = _a.header, headerSize = _a.headerSize;
                _b = searchNodeFromPath(header, pathname), offset = _b.offset, size = _b.size;
                return [2 /*return*/, Buffer.from(buffer, 8 + headerSize + Number(offset), size)];
        }
    });
}); };
export var listPackage = function (archive, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.isHeader, isHeader = _c === void 0 ? false : _c, _d = _b.flat, flat = _d === void 0 ? false : _d;
    return __awaiter(void 0, void 0, void 0, function () {
        var header, _e, _f, flatListChild, listChilds;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if (!isHeader) return [3 /*break*/, 1];
                    _e = archive;
                    return [3 /*break*/, 3];
                case 1:
                    _f = readArchiveHeaderSync;
                    return [4 /*yield*/, getArrayBuffer(archive)];
                case 2:
                    _e = _f.apply(void 0, [_g.sent()]).header;
                    _g.label = 3;
                case 3:
                    header = _e;
                    flatListChild = function (basePath, metadata) {
                        return Object
                            .entries(metadata.files)
                            .flatMap(function (_a) {
                            var key = _a[0], value = _a[1];
                            return isDirectoryMetadata(value)
                                ? flatListChild(path.join(basePath, key), value)
                                : path.join(basePath, key);
                        });
                    };
                    listChilds = function (basePath, metadata) {
                        return isDirectoryMetadata(metadata)
                            ? (Object.fromEntries(Object.entries(metadata.files).map(function (_a) {
                                var key = _a[0], value = _a[1];
                                return [
                                    key,
                                    listChilds(path.join(basePath, key), value)
                                ];
                            })))
                            : basePath;
                    };
                    return [2 /*return*/, (flat
                            ? flatListChild('/', header)
                            : listChilds('/', header))];
            }
        });
    });
};
export var extractAll = function (archive, _a) {
    var _b = (_a === void 0 ? {} : _a).flat, flat = _b === void 0 ? false : _b;
    return __awaiter(void 0, void 0, void 0, function () {
        var buffer, header, _c, _d, _e, _f, extractFolder, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, getArrayBuffer(archive)];
                case 1:
                    buffer = _h.sent();
                    return [4 /*yield*/, readArchiveHeaderSync(buffer)];
                case 2:
                    header = (_h.sent()).header;
                    if (!flat) return [3 /*break*/, 5];
                    _d = (_c = Object).fromEntries;
                    _f = (_e = Promise).all;
                    return [4 /*yield*/, listPackage(header, { isHeader: true, flat: true })];
                case 3: return [4 /*yield*/, _f.apply(_e, [(_h.sent())
                            .map(function (path) { return __awaiter(void 0, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = [path];
                                        return [4 /*yield*/, extractFile(buffer, path)];
                                    case 1: return [2 /*return*/, _a.concat([
                                            _b.sent()
                                        ])];
                                }
                            });
                        }); })])];
                case 4: return [2 /*return*/, _d.apply(_c, [_h.sent()])];
                case 5:
                    extractFolder = function (folder) { return __awaiter(void 0, void 0, void 0, function () {
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _b = (_a = Object).fromEntries;
                                    return [4 /*yield*/, Promise.all(Object
                                            .entries(folder)
                                            .map(function (_a) {
                                            var key = _a[0], value = _a[1];
                                            return __awaiter(void 0, void 0, void 0, function () {
                                                var _b, _c;
                                                return __generator(this, function (_d) {
                                                    switch (_d.label) {
                                                        case 0:
                                                            _b = [key];
                                                            if (!(typeof value === 'object')) return [3 /*break*/, 2];
                                                            return [4 /*yield*/, extractFolder(value)];
                                                        case 1:
                                                            _c = _d.sent();
                                                            return [3 /*break*/, 4];
                                                        case 2: return [4 /*yield*/, extractFile(buffer, value)];
                                                        case 3:
                                                            _c = _d.sent();
                                                            _d.label = 4;
                                                        case 4: return [2 /*return*/, _b.concat([
                                                                _c
                                                            ])];
                                                    }
                                                });
                                            });
                                        }))];
                                case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
                            }
                        });
                    }); };
                    _g = extractFolder;
                    return [4 /*yield*/, listPackage(header, { isHeader: true })];
                case 6: return [2 /*return*/, _g.apply(void 0, [_h.sent()])];
            }
        });
    });
};
//# sourceMappingURL=extractor.js.map