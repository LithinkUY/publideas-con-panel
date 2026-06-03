"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GalleryConfig, GalleryItem } from "@/lib/types";
import { X } from "lucide-react";

export default function GalleryView({ config }: { config: GalleryConfig }) {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

    const filteredItems = activeCategory === "all" 
        ? config.items 
        : config.items.filter(item => item.category_id === activeCategory);

    return (
        <section className="py-20 bg-[#0a0a0a] min-h-screen">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">
                        Nuestra <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#E91E8C]">Galería</span>
                    </h1>
                    <p className="text-white/40 max-w-2xl mx-auto">
                        Explora algunos de nuestros mejores trabajos clasificados por categoría.
                    </p>
                </div>

                {/* Filters */}
                {config.categories.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                        <button
                            onClick={() => setActiveCategory("all")}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                                activeCategory === "all"
                                    ? "bg-[#00CFFF] text-black shadow-[0_0_15px_rgba(0,207,255,0.4)]"
                                    : "bg-[#1a1a1a] text-white/60 hover:text-white border border-[#2a2a2a] hover:border-[#00CFFF]/50"
                            }`}
                        >
                            Todos
                        </button>
                        {config.categories.sort((a,b) => a.order - b.order).map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                                    activeCategory === cat.id
                                        ? "bg-[#00CFFF] text-black shadow-[0_0_15px_rgba(0,207,255,0.4)]"
                                        : "bg-[#1a1a1a] text-white/60 hover:text-white border border-[#2a2a2a] hover:border-[#00CFFF]/50"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <motion.div 
                    layout 
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                    <AnimatePresence>
                        {filteredItems.map(item => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                                key={item.id}
                                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-[#2a2a2a] bg-[#111]"
                                onClick={() => setSelectedImage(item)}
                            >
                                <img 
                                    src={item.image_url} 
                                    alt={item.title || "Trabajo"} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <h3 className="text-white font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        {item.title || "Ver detalle"}
                                    </h3>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-20 text-white/30">
                        No hay imágenes en esta categoría.
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
                        
                        <button 
                            className="absolute top-6 right-6 text-white/50 hover:text-white z-10 bg-black/20 p-2 rounded-full"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={24} />
                        </button>

                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative z-10 max-w-5xl w-full max-h-full flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={selectedImage.image_url} 
                                alt={selectedImage.title || ""} 
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />
                            {selectedImage.title && (
                                <p className="text-white mt-4 text-lg font-medium tracking-wide">
                                    {selectedImage.title}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
