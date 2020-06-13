export var isDirectory = function (val) { return !!val && typeof val === 'object'; };
export var isDirectoryMetadata = function (val) {
    return isDirectory(val)
        && isDirectory(val.files);
};
//# sourceMappingURL=utils.js.map