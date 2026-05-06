"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

interface AuthModalProps {
    open: boolean;
    initialTab?: "login" | "register";
    onClose: () => void;
    onSuccess: (session: PortalSession) => void;
}

export interface PortalSession {
    client_id: number;
    client_code: string;
    name: string;
    email: string;
    pin_code?: string;
    role?: string;
}

const DEPARTAMENTOS = [
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
    "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
    "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto",
    "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

// Shared input style
const inp = "w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00CFFF]/60 transition-colors";
const lbl = "block text-[10px] text-white/40 mb-1 tracking-wider font-medium";

export default function AuthModal({ open, initialTab = "login", onClose, onSuccess }: AuthModalProps) {
    const router = useRouter();
    const [tab, setTab] = useState<"login" | "register">(initialTab);
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Login form
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPw, setLoginPw] = useState("");

    // Register form
    const [reg, setReg] = useState({
        name: "", apellido: "", email: "", password: "", password2: "",
        phone: "", razon_social: "", cedula: "", direccion: "",
        departamento: "", localidad: "", asesor: "", acepta_ofertas: true,
    });

    useEffect(() => {
        if (open) {
            setTab(initialTab);
            setError("");
            setSuccess("");
        }
    }, [open, initialTab]);

    if (!open) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPw }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Error al ingresar."); return; }
            localStorage.setItem("portal_session", JSON.stringify(data.session));
            onSuccess(data.session);
            onClose();
            // Redirect: admins → /admin, clients → /portal
            if (data.session?.role === "admin") {
                router.push("/admin");
            } else {
                router.push("/portal");
            }
        } catch { setError("Error de conexión."); }
        finally { setLoading(false); }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!reg.name.trim() || !reg.email.trim() || !reg.password) {
            setError("Nombre, email y contraseña son requeridos.");
            return;
        }
        if (reg.password !== reg.password2) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: reg.name, apellido: reg.apellido, email: reg.email,
                    password: reg.password, phone: reg.phone,
                    razon_social: reg.razon_social, cedula: reg.cedula,
                    direccion: reg.direccion, departamento: reg.departamento,
                    localidad: reg.localidad, asesor: reg.asesor,
                    acepta_ofertas: reg.acepta_ofertas,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Error al registrar."); return; }
            setSuccess(data.message ?? "¡Registro enviado! Un asesor aprobará tu cuenta.");
        } catch { setError("Error de conexión."); }
        finally { setLoading(false); }
    };

    const setR = (k: keyof typeof reg, v: string | boolean) =>
        setReg(p => ({ ...p, [k]: v }));

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111] shadow-2xl"
                style={{ border: "1.5px solid transparent", background: "linear-gradient(#111,#111) padding-box, linear-gradient(135deg,#00CFFF,#E91E8C,#FFE000,#00CFFF) border-box" }}>

                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white z-10">
                    <X size={18} />
                </button>

                {/* Tabs */}
                <div className="flex border-b border-[#2a2a2a]">
                    {(["login", "register"] as const).map(t => (
                        <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                            className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === t ? "text-white border-b-2 border-[#00CFFF]" : "text-white/30 hover:text-white/60"}`}>
                            {t === "login" ? "Iniciar Sesión" : "Registrarse"}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{error}</div>
                    )}
                    {success && (
                        <div className="mb-4 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 flex items-center gap-2">
                            <CheckCircle size={14} />{success}
                        </div>
                    )}

                    {/* ── LOGIN ── */}
                    {tab === "login" && !success && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <p className="text-xl font-bold text-white mb-1">Bienvenido</p>
                                <p className="text-xs text-white/40">Ingresá a tu cuenta para gestionar tus pedidos.</p>
                            </div>
                            <div>
                                <label className={lbl}>EMAIL</label>
                                <input type="email" required className={inp} placeholder="tu@email.com"
                                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className={lbl}>CONTRASEÑA</label>
                                <div className="relative">
                                    <input type={showPw ? "text" : "password"} required className={inp + " pr-10"}
                                        placeholder="••••••••" value={loginPw} onChange={e => setLoginPw(e.target.value)} />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#E91E8C] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</> : "Ingresar al Sistema"}
                            </button>
                            <p className="text-center text-xs text-white/30 hover:text-white/60 cursor-pointer transition-colors">
                                ¿Olvidaste tu contraseña?
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-[#2a2a2a]" />
                                <span className="text-[10px] text-white/20">O</span>
                                <div className="flex-1 h-px bg-[#2a2a2a]" />
                            </div>
                            <p className="text-center text-xs text-white/40">
                                ¿No tenés cuenta?{" "}
                                <button type="button" onClick={() => setTab("register")} className="text-[#00CFFF] hover:underline font-semibold">
                                    Registrate aquí
                                </button>
                            </p>
                        </form>
                    )}

                    {/* ── REGISTER ── */}
                    {tab === "register" && !success && (
                        <form onSubmit={handleRegister} className="space-y-3">
                            <div>
                                <p className="text-xl font-bold text-white mb-1">Crear cuenta</p>
                                <p className="text-xs text-white/40">Completá tus datos. Un asesor aprobará tu acceso.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>NOMBRE *</label>
                                    <input className={inp} placeholder="Juan" required
                                        value={reg.name} onChange={e => setR("name", e.target.value)} />
                                </div>
                                <div>
                                    <label className={lbl}>APELLIDO</label>
                                    <input className={inp} placeholder="Pérez"
                                        value={reg.apellido} onChange={e => setR("apellido", e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className={lbl}>EMAIL *</label>
                                <input type="email" className={inp} placeholder="tu@email.com" required
                                    value={reg.email} onChange={e => setR("email", e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>CONTRASEÑA *</label>
                                    <div className="relative">
                                        <input type={showPw ? "text" : "password"} className={inp + " pr-9"} placeholder="••••••••" required
                                            value={reg.password} onChange={e => setR("password", e.target.value)} />
                                        <button type="button" onClick={() => setShowPw(p => !p)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                            {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className={lbl}>CONFIRMAR</label>
                                    <div className="relative">
                                        <input type={showPw2 ? "text" : "password"} className={inp + " pr-9"} placeholder="••••••••"
                                            value={reg.password2} onChange={e => setR("password2", e.target.value)} />
                                        <button type="button" onClick={() => setShowPw2(p => !p)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                            {showPw2 ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={lbl}>TELÉFONO</label>
                                <input className={inp} placeholder="+598 99 000 000"
                                    value={reg.phone} onChange={e => setR("phone", e.target.value)} />
                            </div>

                            <div>
                                <label className={lbl}>RAZÓN SOCIAL / EMPRESA</label>
                                <input className={inp} placeholder="Nombre de tu empresa (opcional)"
                                    value={reg.razon_social} onChange={e => setR("razon_social", e.target.value)} />
                            </div>

                            <div>
                                <label className={lbl}>CÉDULA / RUT</label>
                                <input className={inp} placeholder="1.234.567-8"
                                    value={reg.cedula} onChange={e => setR("cedula", e.target.value)} />
                            </div>

                            <div>
                                <label className={lbl}>DIRECCIÓN</label>
                                <input className={inp} placeholder="Calle 1234"
                                    value={reg.direccion} onChange={e => setR("direccion", e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>DEPARTAMENTO</label>
                                    <select className={inp} value={reg.departamento} onChange={e => setR("departamento", e.target.value)}>
                                        <option value="">Seleccionar...</option>
                                        {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={lbl}>LOCALIDAD</label>
                                    <input className={inp} placeholder="Ciudad / Barrio"
                                        value={reg.localidad} onChange={e => setR("localidad", e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className={lbl}>ASESOR (opcional)</label>
                                <input className={inp} placeholder="Nombre de tu asesor comercial"
                                    value={reg.asesor} onChange={e => setR("asesor", e.target.value)} />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded accent-[#00CFFF]"
                                    checked={reg.acepta_ofertas}
                                    onChange={e => setR("acepta_ofertas", e.target.checked)} />
                                <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
                                    Acepto recibir ofertas y novedades
                                </span>
                            </label>

                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#00CFFF] text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : "Enviar Registro"}
                            </button>

                            <p className="text-center text-xs text-white/40">
                                ¿Ya tenés cuenta?{" "}
                                <button type="button" onClick={() => setTab("login")} className="text-[#00CFFF] hover:underline font-semibold">
                                    Iniciá sesión
                                </button>
                            </p>
                        </form>
                    )}

                    {/* Success state after register */}
                    {success && (
                        <div className="text-center py-4 space-y-3">
                            <CheckCircle size={40} className="mx-auto text-green-400" />
                            <p className="text-white font-semibold">{success}</p>
                            <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] text-sm font-semibold hover:bg-[#00CFFF]/20 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
