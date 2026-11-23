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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Injectable, UnauthorizedException, } from '@nestjs/common';
import * as crypto from 'node:crypto';
let JwtAuthGuard = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var JwtAuthGuard = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            JwtAuthGuard = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        getSecret() {
            return process.env.JWT_SECRET || 'bgs-microfe-enterprise-secret-key-2026';
        }
        isBypassEnabled() {
            const raw = (process.env.userbypass || process.env.VITE_USER_BYPASS || '').toLowerCase();
            return raw === 'true' || raw === '1';
        }
        canActivate(context) {
            const req = context.switchToHttp().getRequest();
            const authHeader = req.headers['authorization'];
            // 1. Verifikasi Token jika ada
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7).trim();
                const user = this.verifyToken(token);
                if (user) {
                    req.user = user;
                    return true;
                }
            }
            // 2. Mode Dev Bypass jika diizinkan di .env atau tidak ada token di dev mode
            if (this.isBypassEnabled()) {
                const defaultUserId = 'usr-1';
                req.user = {
                    id: defaultUserId,
                    email: 'admin@bgs-software.id',
                    role: 'Super Administrator',
                    kdMember: Buffer.from(defaultUserId).toString('base64'),
                };
                return true;
            }
            throw new UnauthorizedException('Sesi autentikasi tidak ditemukan atau token tidak valid. Silakan login kembali.');
        }
        verifyToken(token) {
            try {
                const secret = this.getSecret();
                const parts = token.split('.');
                if (parts.length !== 3)
                    return null;
                const [header, body, signature] = parts;
                const expectedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(`${header}.${body}`)
                    .digest('base64url');
                if (signature !== expectedSignature)
                    return null;
                const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
                if (payload.exp && Date.now() > payload.exp) {
                    return null; // Token Expired
                }
                if (!payload.id)
                    return null;
                return {
                    id: payload.id,
                    email: payload.email || '',
                    role: payload.role || 'User',
                    kdMember: Buffer.from(payload.id).toString('base64'),
                };
            }
            catch {
                return null;
            }
        }
    };
    return JwtAuthGuard = _classThis;
})();
export { JwtAuthGuard };
