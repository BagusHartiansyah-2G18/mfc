var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Controller, Get, Post, Put, Delete, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
let NotesController = (() => {
    let _classDecorators = [Controller('notes')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _health_decorators;
    let _getNotes_decorators;
    let _getSubNotes_decorators;
    let _getMetrics_decorators;
    let _createNote_decorators;
    let _updateNote_decorators;
    let _deleteNote_decorators;
    var NotesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _health_decorators = [Get('health')];
            _getNotes_decorators = [Get(), UseGuards(JwtAuthGuard)];
            _getSubNotes_decorators = [Get('sub'), UseGuards(JwtAuthGuard)];
            _getMetrics_decorators = [Get('metrics'), UseGuards(JwtAuthGuard)];
            _createNote_decorators = [Post('add'), UseGuards(JwtAuthGuard)];
            _updateNote_decorators = [Put('upd'), UseGuards(JwtAuthGuard)];
            _deleteNote_decorators = [Delete(':kdJudul'), UseGuards(JwtAuthGuard)];
            __esDecorate(this, null, _health_decorators, { kind: "method", name: "health", static: false, private: false, access: { has: obj => "health" in obj, get: obj => obj.health }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getNotes_decorators, { kind: "method", name: "getNotes", static: false, private: false, access: { has: obj => "getNotes" in obj, get: obj => obj.getNotes }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSubNotes_decorators, { kind: "method", name: "getSubNotes", static: false, private: false, access: { has: obj => "getSubNotes" in obj, get: obj => obj.getSubNotes }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getMetrics_decorators, { kind: "method", name: "getMetrics", static: false, private: false, access: { has: obj => "getMetrics" in obj, get: obj => obj.getMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createNote_decorators, { kind: "method", name: "createNote", static: false, private: false, access: { has: obj => "createNote" in obj, get: obj => obj.createNote }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateNote_decorators, { kind: "method", name: "updateNote", static: false, private: false, access: { has: obj => "updateNote" in obj, get: obj => obj.updateNote }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteNote_decorators, { kind: "method", name: "deleteNote", static: false, private: false, access: { has: obj => "deleteNote" in obj, get: obj => obj.deleteNote }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        notesService = __runInitializers(this, _instanceExtraInitializers);
        constructor(notesService) {
            this.notesService = notesService;
        }
        health() {
            return {
                success: true,
                status: 'ok',
                service: 'api-noted',
                timestamp: new Date().toISOString(),
            };
        }
        async getNotes(query, req) {
            return await this.notesService.getNotes(query, req.user);
        }
        async getSubNotes(query, req) {
            return await this.notesService.getSubNotes(query, req.user);
        }
        async getMetrics(req) {
            return await this.notesService.getMetrics(req.user);
        }
        async createNote(dto, req) {
            return await this.notesService.createNote(dto, req.user);
        }
        async updateNote(dto, req) {
            return await this.notesService.updateNote(dto, req.user);
        }
        async deleteNote(kdJudul, req) {
            return await this.notesService.deleteNote(kdJudul, req.user);
        }
    };
    return NotesController = _classThis;
})();
export { NotesController };
