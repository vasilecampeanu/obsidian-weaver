import { Component, MarkdownRenderer } from "obsidian";
import { usePlugin } from "providers/plugin/usePlugin";
import React, { useEffect, useState } from "react";

interface MarkdownContentProps {
    content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
    const app = usePlugin().app;
    const [renderedContent, setRenderedContent] = useState<{ __html: string } | null>(null);

    useEffect(() => {
        let isMounted = true;
        const container = document.createElement("div");
        const context = new Component();

        MarkdownRenderer.render(app, content, container, "", context)
            .then(() => {
                if (isMounted) {
                    setRenderedContent({ __html: container.innerHTML });
                }
                context.unload();
            })
            .catch((error) => {
                console.error("Markdown rendering failed:", error);
                if (isMounted) {
                    setRenderedContent({ __html: "<p>Error rendering content.</p>" });
                }
                context.unload();
            });

        return () => {
            isMounted = false;
            context.unload();
        };
    }, [content, app]);

    return (
        <div
            className="ow-rendered-md-content"
            dangerouslySetInnerHTML={renderedContent || { __html: "" }}
        />
    );
};
