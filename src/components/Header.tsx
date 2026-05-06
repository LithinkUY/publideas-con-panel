"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Menu, X, User, LogOut, ShoppingBag, UserCircle } from "lucide-react";
import { NavItem, SiteConfig } from "@/lib/types";
import { mockSiteConfig } from "@/lib/mock-data";
import AuthModal, { PortalSession } from "@/components/AuthModal";

// Logo USER con colores CMYK
function UserLogo({ config }: { config: SiteConfig }) {
    const [c, m, y, w] = config.logo_colors;
    return (
        <Link href="/" className="flex flex-col items-start leading-none">
            <span className="text-3xl font-black tracking-tighter text-white" style={{ fontStyle: "italic" }}>
                {config.logo_text}
            </span>
            <div className="flex gap-[3px] mt-[2px]">
                {[c, m, y, w].map((color, i) => (
                    <div key={i} className="h-[4px] w-[14px] rounded-sm" style={{ backgroundColor: color }} />
                ))}
            </div>
        </Link>
    );
}

// Barras CMYK que aparecen al hacer hover
function CmykUnderline({ visible }: { visible: boolean }) {
    const colors = ["#00CFFF", "#E91E8C", "#FFE000", "#444"];
    return (
        <div className="absolute -bottom-[5px] left-0 right-0 flex gap-[2px]">
            {colors.map((color, i) => (
                <div
                    key={i}
                    className="h-[3px] flex-1 rounded-full"
                    style={{
                        backgroundColor: color,
                        transform: visible ? "scaleX(1)" : "scaleX(0)",
                        transformOrigin: "left center",
                        transition: `transform 0.22s cubic-bezier(0.4,0,0.2,1) ${i * 40}ms`,
                    }}
                />
            ))}
        </div>
    );
}

function NavItemComponent({ item }: { item: NavItem }) {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(false);

    if (!item.children) {
        return (
            <Link
                href={item.href}
                className="relative text-sm font-medium text-white/80 hover:text-white transition-colors whitespace-nowrap pb-1"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {item.label}
                <CmykUnderline visible={hovered} />
            </Link>
        );
    }
    return (
        <div
            className="relative"
            onMouseEnter={() => { setOpen(true); setHovered(true); }}
            onMouseLeave={() => { setOpen(false); setHovered(false); }}
        >
            <button className="relative flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white transition-colors pb-1">
                {item.label} <ChevronDown size={14} />
                <CmykUnderline visible={hovered} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg py-1 min-w-[160px] z-50 shadow-xl">
                    {item.children.map((child) => (
                        <Link key={child.href} href={child.href} className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                            {child.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function RetiraButton({ label, session, onAuth, onNavigate }: { label: string; session: PortalSession | null; onAuth: () => void; onNavigate: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            className="relative text-sm font-medium text-white/80 hover:text-white transition-colors whitespace-nowrap pb-1"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => session ? onNavigate() : onAuth()}
        >
            {label}
            <CmykUnderline visible={hovered} />
        </button>
    );
}

export default function Header() {
    const router = useRouter();
    const [config, setConfig] = useState<SiteConfig>(mockSiteConfig);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [session, setSession] = useState<PortalSession | null>(null);
    const [authOpen, setAuthOpen] = useState(false);
    const [authTab, setAuthTab] = useState<"login" | "register">("login");
    const [portalOpen, setPortalOpen] = useState(false);
    const portalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/config?key=siteconfig")
            .then(r => r.json())
            .then(val => {
                if (val && typeof val === "object") {
                    const merged = { ...mockSiteConfig, ...val };
                    setConfig(merged);
                    if (merged.logo_text) {
                        document.title = `${merged.logo_text} | Autogestión`;
                    }
                }
            })
            .catch(() => { });

        // Restore session from localStorage
        try {
            const raw = localStorage.getItem("portal_session");
            if (raw) setSession(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    // Close portal dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (portalRef.current && !portalRef.current.contains(e.target as Node)) {
                setPortalOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const logout = () => {
        localStorage.removeItem("portal_session");
        setSession(null);
        setPortalOpen(false);
    };

    const openAuth = (tab: "login" | "register") => {
        setAuthTab(tab);
        setAuthOpen(true);
        setMobileOpen(false);
    };

    const mainNav = config.nav_items.filter((n) => n.label !== "HACÉ TU PEDIDO");
    const ctaBtn = config.nav_items.find((n) => n.label === "HACÉ TU PEDIDO");

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
                    <UserLogo config={config} />

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-6">
                        {mainNav.map((item) => {
                            const isRetira = item.label.toUpperCase().includes("RETIR");
                            if (isRetira) {
                                return (
                                    <RetiraButton key={item.label} label={item.label} session={session} onAuth={() => openAuth("login")} onNavigate={() => router.push("/portal?section=retiro")} />
                                );
                            }
                            return <NavItemComponent key={item.label} item={item} />;
                        })}
                        {ctaBtn && (
                            <Link href={ctaBtn.href} className="px-4 py-2 text-sm font-semibold border border-white rounded-full hover:bg-white hover:text-black transition-all whitespace-nowrap">
                                {ctaBtn.label}
                            </Link>
                        )}
                    </nav>

                    {/* Auth area - desktop */}
                    <div className="hidden lg:flex items-center gap-3">
                        {session ? (
                            <div className="relative" ref={portalRef}>
                                <button onClick={() => setPortalOpen(p => !p)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white font-medium">
                                    <UserCircle size={18} className="text-[#00CFFF]" />
                                    Mi Portal
                                    <ChevronDown size={14} className={`transition-transform ${portalOpen ? "rotate-180" : ""}`} />
                                </button>
                                {portalOpen && (
                                    <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-1 min-w-[180px] z-50 shadow-2xl">
                                        <div className="px-4 py-2.5 border-b border-[#2a2a2a]">
                                            <p className="text-xs font-semibold text-white">{session.name}</p>
                                            <p className="text-[10px] text-white/30 mt-0.5">{session.email}</p>
                                        </div>
                                        <Link href="/portal?section=historial" onClick={() => setPortalOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                                            <ShoppingBag size={14} /> Mis Pedidos
                                        </Link>
                                        <Link href="/portal?section=perfil" onClick={() => setPortalOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                                            <User size={14} /> Mi Cuenta
                                        </Link>
                                        <Link href="/portal?section=retiro" onClick={() => setPortalOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                                            <ShoppingBag size={14} /> Retiro de Pedidos
                                        </Link>
                                        <div className="border-t border-[#2a2a2a] mt-1 pt-1">
                                            <button onClick={logout}
                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors">
                                                <LogOut size={14} /> Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button onClick={() => openAuth("login")}
                                    className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                                    Iniciar sesión
                                </button>
                                <button onClick={() => openAuth("register")}
                                    className="px-4 py-2 text-sm font-semibold rounded-full text-black"
                                    style={{ background: "linear-gradient(90deg,#00CFFF,#E91E8C)" }}>
                                    Registrarse
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button className="lg:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="lg:hidden bg-[#111] border-t border-[#2a2a2a] px-4 py-4 flex flex-col gap-3">
                        {config.nav_items.map((item) => {
                            const isRetira = item.label.toUpperCase().includes("RETIR");
                            if (isRetira) {
                                return (
                                    <button key={item.label} onClick={() => { setMobileOpen(false); if (session) router.push("/portal?section=retiro"); else openAuth("login"); }} className="text-left text-sm text-white/80 hover:text-white py-1">
                                        {item.label}
                                    </button>
                                );
                            }
                            return (
                                <Link key={item.label} href={item.href} className="text-sm text-white/80 hover:text-white py-1" onClick={() => setMobileOpen(false)}>
                                    {item.label}
                                </Link>
                            );
                        })}
                        <div className="border-t border-[#2a2a2a] pt-3 flex flex-col gap-2">
                            {session ? (
                                <>
                                    <Link href="/portal?section=historial" className="text-sm text-white/70 py-1" onClick={() => setMobileOpen(false)}>Mis Pedidos</Link>
                                    <Link href="/portal?section=perfil" className="text-sm text-white/70 py-1" onClick={() => setMobileOpen(false)}>Mi Cuenta</Link>
                                    <button onClick={logout} className="text-left text-sm text-red-400 py-1">Cerrar Sesión</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => openAuth("login")} className="text-sm text-white/70 py-1 text-left">Iniciar sesión</button>
                                    <button onClick={() => openAuth("register")} className="text-sm text-[#00CFFF] py-1 text-left font-semibold">Registrarse</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <AuthModal
                open={authOpen}
                initialTab={authTab}
                onClose={() => setAuthOpen(false)}
                onSuccess={(s) => setSession(s)}
            />
        </>
    );
}
