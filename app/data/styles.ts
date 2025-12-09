export interface DesignStyle {
    id: string;
    name: string;
    icon: string; // SVG path d attribute
    simplePrompt: string;
    extensivePrompt: string;
}

export const DESIGN_STYLES: DesignStyle[] = [
    {
        id: 'modern',
        name: 'Modern',
        // Cube / Geometric
        icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
        simplePrompt: 'clean lines, minimal clutter, neutral palette, functional furniture',
        extensivePrompt: 'Render this room in a sleek Modern style. Use clean lines, minimalist furniture, and a neutral color palette (white, grey, black). Incorporate materials like glass, metal, and smooth wood. Ensure the space is clutter-free and functional with contemporary, geometric lighting. The final look should be elegant, simple, and high-end.'
    },
    {
        id: 'scandinavian',
        name: 'Scandinavian',
        // Leaf/Nature
        icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
        simplePrompt: 'bright, airy, cozy minimalism, natural wood, soft textures',
        extensivePrompt: 'Render this room in a Scandinavian style. Make it bright, airy, and cozy. Use light wood tones, white walls, and natural fabrics. Add subtle pastels, indoor plants, and soft textures. Focus on simplicity, comfort, and natural light. Avoid heavy ornamentation or dark colors.'
    },
    {
        id: 'industrial',
        name: 'Industrial',
        // Gear/Factory
        icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
        simplePrompt: 'raw materials, metal + wood, loft feel, exposed brick/pipes',
        extensivePrompt: 'Render this room in an Industrial style. Feature exposed brick or concrete, metal fixtures, and reclaimed wood. Use a neutral earth tone palette with leather accents and iron piping. Include large factory-style windows if possible. Lighting should be warm and warehouse-inspired (e.g., Edison bulbs).'
    },
    {
        id: 'boho',
        name: 'Bohemian',
        // Plant/Flower
        icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.636-1.636L13.288 18.5l1.183-.394a2.25 2.25 0 001.636-1.636L16.5 15.25l.394 1.183a2.25 2.25 0 001.636 1.636l1.183.394-1.183.394a2.25 2.25 0 00-1.636 1.636z',
        simplePrompt: 'artistic, earthy, layered patterns, plants, eclectic',
        extensivePrompt: 'Render this room in a Bohemian (Boho) style. Create an artistic, relaxed, and eclectic space. Use warm earthy tones, layered patterns, and plenty of indoor plants. Incorporate vintage or handmade pieces, woven textiles, rugs, and natural materials. The design should feel lived-in and expressive.'
    },
    {
        id: 'traditional',
        name: 'Traditional',
        // Column/Classic
        icon: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
        simplePrompt: 'classic furniture, warm color palette, symmetry, refined details',
        extensivePrompt: 'Render this room in a Traditional style. Use classic furniture shapes, rich wood finishes, and elegant details. Emphasize symmetry and a warm neutral color palette. Incorporate paneling, molding, patterned fabrics, and refined decor like chandeliers. Avoid modern minimalism.'
    },
    {
        id: 'architectural',
        name: 'Architectural',
        // Ruler/Pencil/Blueprint
        icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
        simplePrompt: 'blueprint style, architectural sketch, white lines on blue, technical drawing',
        extensivePrompt: 'Render this room as a professional architectural blueprint or technical sketch. Use a high-contrast style, such as white lines on a blueprint blue background or black ink on white paper. Highlight structural details, dimensions, and layout. Maintain the exact perspective and geometry. The look should be precise, technical, and schematic.'
    }
];
