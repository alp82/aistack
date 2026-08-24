import { z } from 'zod';
import { TanStackStartVitePluginCoreOptions } from './types.js';
export declare function parseStartConfig(opts: z.input<typeof tanstackStartOptionsSchema>, corePluginOpts: TanStackStartVitePluginCoreOptions, root: string): {
    router: {
        target: import('./types.js').CompileStartFrameworkOptions;
        routeFileIgnorePrefix: string;
        routesDirectory: string;
        quoteStyle: "single" | "double";
        semicolons: boolean;
        disableLogging: boolean;
        routeTreeFileHeader: string[];
        indexToken: string;
        routeToken: string;
        generatedRouteTree: string;
        disableTypes: boolean;
        addExtensions: boolean;
        enableRouteTreeFormatting: boolean;
        tmpDir: string;
        importRoutesUsingAbsolutePaths: boolean;
        enableRouteGeneration?: boolean | undefined;
        codeSplittingOptions?: import('@tanstack/router-plugin').CodeSplittingOptions | undefined;
        plugin?: {
            vite?: {
                environmentName?: string | undefined;
            } | undefined;
        } | undefined;
        virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
        routeFilePrefix?: string | undefined;
        routeFileIgnorePattern?: string | undefined;
        pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
        verboseFileRoutes?: boolean | undefined;
        routeTreeFileFooter?: string[] | ((...args: unknown[]) => string[]) | undefined;
        autoCodeSplitting?: boolean | undefined;
        customScaffolding?: {
            routeTemplate?: string | undefined;
            lazyRouteTemplate?: string | undefined;
        } | undefined;
        experimental?: {
            enableCodeSplitting?: boolean | undefined;
        } | undefined;
        plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
        entry?: string | undefined;
        basepath?: string | undefined;
    };
    srcDirectory: string;
    start: {
        entry?: string | undefined;
    };
    client: {
        base: string;
        entry?: string | undefined;
    };
    server: {
        entry?: string | undefined;
    };
    serverFns: {
        base: string;
        generateFunctionId?: ((args_0: {
            filename: string;
            functionName: string;
        }, ...args: unknown[]) => string | undefined) | undefined;
    };
    pages: {
        path: string;
        sitemap?: {
            exclude?: boolean | undefined;
            priority?: number | undefined;
            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
            lastmod?: string | Date | undefined;
            alternateRefs?: {
                href: string;
                hreflang: string;
            }[] | undefined;
            images?: {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }[] | undefined;
            news?: {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            } | undefined;
        } | undefined;
        fromCrawl?: boolean | undefined;
        prerender?: {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined;
    }[];
    sitemap?: {
        enabled: boolean;
        outputPath: string;
        host?: string | undefined;
    } | undefined;
    prerender?: ({
        filter?: ((args_0: {
            path: string;
            sitemap?: {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            } | undefined;
            fromCrawl?: boolean | undefined;
            prerender?: {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            } | undefined;
        }, ...args: unknown[]) => any) | undefined;
        enabled?: boolean | undefined;
        concurrency?: number | undefined;
        failOnError?: boolean | undefined;
        autoStaticPathsDiscovery?: boolean | undefined;
        maxRedirects?: number | undefined;
    } & {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    }) | undefined;
    spa?: {
        enabled: boolean;
        prerender: {
            enabled: boolean;
            outputPath: string;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks: boolean;
            retryCount: number;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        };
        maskPath: string;
    } | undefined;
    vite?: {
        installDevServerMiddleware?: boolean | undefined;
    } | undefined;
};
declare const pageSchema: z.ZodObject<{
    path: z.ZodString;
    sitemap: z.ZodOptional<z.ZodObject<{
        exclude: z.ZodOptional<z.ZodBoolean>;
        priority: z.ZodOptional<z.ZodNumber>;
        changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
        lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            href: z.ZodString;
            hreflang: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            href: string;
            hreflang: string;
        }, {
            href: string;
            hreflang: string;
        }>, "many">>;
        images: z.ZodOptional<z.ZodArray<z.ZodObject<{
            loc: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            loc: string;
            caption?: string | undefined;
            title?: string | undefined;
        }, {
            loc: string;
            caption?: string | undefined;
            title?: string | undefined;
        }>, "many">>;
        news: z.ZodOptional<z.ZodObject<{
            publication: z.ZodObject<{
                name: z.ZodString;
                language: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                language: string;
            }, {
                name: string;
                language: string;
            }>;
            publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
            title: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            title: string;
            publication: {
                name: string;
                language: string;
            };
            publicationDate: string | Date;
        }, {
            title: string;
            publication: {
                name: string;
                language: string;
            };
            publicationDate: string | Date;
        }>>;
    }, "strip", z.ZodTypeAny, {
        exclude?: boolean | undefined;
        priority?: number | undefined;
        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
        lastmod?: string | Date | undefined;
        alternateRefs?: {
            href: string;
            hreflang: string;
        }[] | undefined;
        images?: {
            loc: string;
            caption?: string | undefined;
            title?: string | undefined;
        }[] | undefined;
        news?: {
            title: string;
            publication: {
                name: string;
                language: string;
            };
            publicationDate: string | Date;
        } | undefined;
    }, {
        exclude?: boolean | undefined;
        priority?: number | undefined;
        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
        lastmod?: string | Date | undefined;
        alternateRefs?: {
            href: string;
            hreflang: string;
        }[] | undefined;
        images?: {
            loc: string;
            caption?: string | undefined;
            title?: string | undefined;
        }[] | undefined;
        news?: {
            title: string;
            publication: {
                name: string;
                language: string;
            };
            publicationDate: string | Date;
        } | undefined;
    }>>;
    fromCrawl: z.ZodOptional<z.ZodBoolean>;
} & {
    prerender: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        outputPath: z.ZodOptional<z.ZodString>;
        autoSubfolderIndex: z.ZodOptional<z.ZodBoolean>;
        crawlLinks: z.ZodOptional<z.ZodBoolean>;
        retryCount: z.ZodOptional<z.ZodNumber>;
        retryDelay: z.ZodOptional<z.ZodNumber>;
        onSuccess: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
            page: z.ZodObject<{
                path: z.ZodString;
                sitemap: z.ZodOptional<z.ZodObject<{
                    exclude: z.ZodOptional<z.ZodBoolean>;
                    priority: z.ZodOptional<z.ZodNumber>;
                    changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
                    lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
                    alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                        href: z.ZodString;
                        hreflang: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        href: string;
                        hreflang: string;
                    }, {
                        href: string;
                        hreflang: string;
                    }>, "many">>;
                    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
                        loc: z.ZodString;
                        caption: z.ZodOptional<z.ZodString>;
                        title: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }, {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }>, "many">>;
                    news: z.ZodOptional<z.ZodObject<{
                        publication: z.ZodObject<{
                            name: z.ZodString;
                            language: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            name: string;
                            language: string;
                        }, {
                            name: string;
                            language: string;
                        }>;
                        publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
                        title: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    }, {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                }, {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                }>>;
                fromCrawl: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            }, {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            }>;
            html: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }>], z.ZodUnknown>, z.ZodAny>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    }, {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    sitemap?: {
        exclude?: boolean | undefined;
        priority?: number | undefined;
        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
        lastmod?: string | Date | undefined;
        alternateRefs?: {
            href: string;
            hreflang: string;
        }[] | undefined;
        images?: {
            loc: string;
            caption?: string | undefined;
            title?: string | undefined;
        }[] | undefined;
        news?: {
            title: string;
            publication: {
                name: string;
                language: string;
            };
            publicationDate: string | Date;
        } | undefined;
    } | undefined;
    fromCrawl?: boolean | undefined;
    prerender?: {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    } | undefined;
}, {
    path: string;
    sitemap?: {
        exclude?: boolean | undefined;
        priority?: number | undefined;
        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
        lastmod?: string | Date | undefined;
        alternateRefs?: {
            href: string;
            hreflang: string;
        }[] | undefined;
        images?: {
            loc: string;
            caption?: string | undefined;
            title?: string | undefined;
        }[] | undefined;
        news?: {
            title: string;
            publication: {
                name: string;
                language: string;
            };
            publicationDate: string | Date;
        } | undefined;
    } | undefined;
    fromCrawl?: boolean | undefined;
    prerender?: {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    } | undefined;
}>;
declare const tanstackStartOptionsSchema: z.ZodDefault<z.ZodOptional<z.ZodObject<{
    srcDirectory: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    start: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        entry: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        entry?: string | undefined;
    }, {
        entry?: string | undefined;
    }>>>;
    router: z.ZodDefault<z.ZodOptional<z.ZodIntersection<z.ZodObject<{
        entry: z.ZodOptional<z.ZodString>;
        basepath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        entry?: string | undefined;
        basepath?: string | undefined;
    }, {
        entry?: string | undefined;
        basepath?: string | undefined;
    }>, z.ZodDefault<z.ZodOptional<z.ZodObject<{
        virtualRouteConfig: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodType<import('@tanstack/virtual-file-routes').VirtualRootRoute, z.ZodTypeDef, import('@tanstack/virtual-file-routes').VirtualRootRoute>, z.ZodString]>>>;
        routeFilePrefix: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        routeFileIgnorePrefix: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
        routeFileIgnorePattern: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        routesDirectory: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
        quoteStyle: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<["single", "double"]>>>>;
        semicolons: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
        disableLogging: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
        routeTreeFileHeader: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>>;
        indexToken: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
        routeToken: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
        pathParamsAllowedCharacters: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<[";", ":", "@", "&", "=", "+", "$", ","]>, "many">>>;
        generatedRouteTree: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
        disableTypes: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
        addExtensions: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
        enableRouteTreeFormatting: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
        routeTreeFileFooter: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodArray<z.ZodString, "many">>]>>>;
        customScaffolding: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            routeTemplate: z.ZodOptional<z.ZodString>;
            lazyRouteTemplate: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            routeTemplate?: string | undefined;
            lazyRouteTemplate?: string | undefined;
        }, {
            routeTemplate?: string | undefined;
            lazyRouteTemplate?: string | undefined;
        }>>>;
        experimental: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            enableCodeSplitting: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enableCodeSplitting?: boolean | undefined;
        }, {
            enableCodeSplitting?: boolean | undefined;
        }>>>;
        plugins: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodType<import('@tanstack/router-generator').GeneratorPlugin, z.ZodTypeDef, import('@tanstack/router-generator').GeneratorPlugin>, "many">>>;
        tmpDir: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
        importRoutesUsingAbsolutePaths: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
        enableRouteGeneration: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        codeSplittingOptions: z.ZodOptional<z.ZodOptional<z.ZodType<import('@tanstack/router-plugin').CodeSplittingOptions, z.ZodTypeDef, import('@tanstack/router-plugin').CodeSplittingOptions>>>;
        plugin: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            vite: z.ZodOptional<z.ZodObject<{
                environmentName: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                environmentName?: string | undefined;
            }, {
                environmentName?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            vite?: {
                environmentName?: string | undefined;
            } | undefined;
        }, {
            vite?: {
                environmentName?: string | undefined;
            } | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
        routeFilePrefix?: string | undefined;
        routeFileIgnorePrefix?: string | undefined;
        routeFileIgnorePattern?: string | undefined;
        routesDirectory?: string | undefined;
        quoteStyle?: "single" | "double" | undefined;
        semicolons?: boolean | undefined;
        disableLogging?: boolean | undefined;
        routeTreeFileHeader?: string[] | undefined;
        indexToken?: string | undefined;
        routeToken?: string | undefined;
        pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
        generatedRouteTree?: string | undefined;
        disableTypes?: boolean | undefined;
        addExtensions?: boolean | undefined;
        enableRouteTreeFormatting?: boolean | undefined;
        routeTreeFileFooter?: string[] | ((...args: unknown[]) => string[]) | undefined;
        customScaffolding?: {
            routeTemplate?: string | undefined;
            lazyRouteTemplate?: string | undefined;
        } | undefined;
        experimental?: {
            enableCodeSplitting?: boolean | undefined;
        } | undefined;
        plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
        tmpDir?: string | undefined;
        importRoutesUsingAbsolutePaths?: boolean | undefined;
        enableRouteGeneration?: boolean | undefined;
        codeSplittingOptions?: import('@tanstack/router-plugin').CodeSplittingOptions | undefined;
        plugin?: {
            vite?: {
                environmentName?: string | undefined;
            } | undefined;
        } | undefined;
    }, {
        virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
        routeFilePrefix?: string | undefined;
        routeFileIgnorePrefix?: string | undefined;
        routeFileIgnorePattern?: string | undefined;
        routesDirectory?: string | undefined;
        quoteStyle?: "single" | "double" | undefined;
        semicolons?: boolean | undefined;
        disableLogging?: boolean | undefined;
        routeTreeFileHeader?: string[] | undefined;
        indexToken?: string | undefined;
        routeToken?: string | undefined;
        pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
        generatedRouteTree?: string | undefined;
        disableTypes?: boolean | undefined;
        addExtensions?: boolean | undefined;
        enableRouteTreeFormatting?: boolean | undefined;
        routeTreeFileFooter?: string[] | ((...args: unknown[]) => string[]) | undefined;
        customScaffolding?: {
            routeTemplate?: string | undefined;
            lazyRouteTemplate?: string | undefined;
        } | undefined;
        experimental?: {
            enableCodeSplitting?: boolean | undefined;
        } | undefined;
        plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
        tmpDir?: string | undefined;
        importRoutesUsingAbsolutePaths?: boolean | undefined;
        enableRouteGeneration?: boolean | undefined;
        codeSplittingOptions?: import('@tanstack/router-plugin').CodeSplittingOptions | undefined;
        plugin?: {
            vite?: {
                environmentName?: string | undefined;
            } | undefined;
        } | undefined;
    }>>>>>>;
    client: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        entry: z.ZodOptional<z.ZodString>;
        base: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        base: string;
        entry?: string | undefined;
    }, {
        entry?: string | undefined;
        base?: string | undefined;
    }>>>;
    server: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        entry: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        entry?: string | undefined;
    }, {
        entry?: string | undefined;
    }>>>;
    serverFns: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        base: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        generateFunctionId: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
            filename: z.ZodString;
            functionName: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            filename: string;
            functionName: string;
        }, {
            filename: string;
            functionName: string;
        }>], z.ZodUnknown>, z.ZodOptional<z.ZodString>>>;
    }, "strip", z.ZodTypeAny, {
        base: string;
        generateFunctionId?: ((args_0: {
            filename: string;
            functionName: string;
        }, ...args: unknown[]) => string | undefined) | undefined;
    }, {
        base?: string | undefined;
        generateFunctionId?: ((args_0: {
            filename: string;
            functionName: string;
        }, ...args: unknown[]) => string | undefined) | undefined;
    }>>>;
    pages: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        sitemap: z.ZodOptional<z.ZodObject<{
            exclude: z.ZodOptional<z.ZodBoolean>;
            priority: z.ZodOptional<z.ZodNumber>;
            changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
            lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
            alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                href: z.ZodString;
                hreflang: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                href: string;
                hreflang: string;
            }, {
                href: string;
                hreflang: string;
            }>, "many">>;
            images: z.ZodOptional<z.ZodArray<z.ZodObject<{
                loc: z.ZodString;
                caption: z.ZodOptional<z.ZodString>;
                title: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }, {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }>, "many">>;
            news: z.ZodOptional<z.ZodObject<{
                publication: z.ZodObject<{
                    name: z.ZodString;
                    language: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    name: string;
                    language: string;
                }, {
                    name: string;
                    language: string;
                }>;
                publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
                title: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            }, {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            }>>;
        }, "strip", z.ZodTypeAny, {
            exclude?: boolean | undefined;
            priority?: number | undefined;
            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
            lastmod?: string | Date | undefined;
            alternateRefs?: {
                href: string;
                hreflang: string;
            }[] | undefined;
            images?: {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }[] | undefined;
            news?: {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            } | undefined;
        }, {
            exclude?: boolean | undefined;
            priority?: number | undefined;
            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
            lastmod?: string | Date | undefined;
            alternateRefs?: {
                href: string;
                hreflang: string;
            }[] | undefined;
            images?: {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }[] | undefined;
            news?: {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            } | undefined;
        }>>;
        fromCrawl: z.ZodOptional<z.ZodBoolean>;
    } & {
        prerender: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            outputPath: z.ZodOptional<z.ZodString>;
            autoSubfolderIndex: z.ZodOptional<z.ZodBoolean>;
            crawlLinks: z.ZodOptional<z.ZodBoolean>;
            retryCount: z.ZodOptional<z.ZodNumber>;
            retryDelay: z.ZodOptional<z.ZodNumber>;
            onSuccess: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
                page: z.ZodObject<{
                    path: z.ZodString;
                    sitemap: z.ZodOptional<z.ZodObject<{
                        exclude: z.ZodOptional<z.ZodBoolean>;
                        priority: z.ZodOptional<z.ZodNumber>;
                        changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
                        lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
                        alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                            href: z.ZodString;
                            hreflang: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            href: string;
                            hreflang: string;
                        }, {
                            href: string;
                            hreflang: string;
                        }>, "many">>;
                        images: z.ZodOptional<z.ZodArray<z.ZodObject<{
                            loc: z.ZodString;
                            caption: z.ZodOptional<z.ZodString>;
                            title: z.ZodOptional<z.ZodString>;
                        }, "strip", z.ZodTypeAny, {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }, {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }>, "many">>;
                        news: z.ZodOptional<z.ZodObject<{
                            publication: z.ZodObject<{
                                name: z.ZodString;
                                language: z.ZodString;
                            }, "strip", z.ZodTypeAny, {
                                name: string;
                                language: string;
                            }, {
                                name: string;
                                language: string;
                            }>;
                            publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
                            title: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        }, {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    }, {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    }>>;
                    fromCrawl: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                }, {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                }>;
                html: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }>], z.ZodUnknown>, z.ZodAny>>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        }, {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        sitemap?: {
            exclude?: boolean | undefined;
            priority?: number | undefined;
            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
            lastmod?: string | Date | undefined;
            alternateRefs?: {
                href: string;
                hreflang: string;
            }[] | undefined;
            images?: {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }[] | undefined;
            news?: {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            } | undefined;
        } | undefined;
        fromCrawl?: boolean | undefined;
        prerender?: {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined;
    }, {
        path: string;
        sitemap?: {
            exclude?: boolean | undefined;
            priority?: number | undefined;
            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
            lastmod?: string | Date | undefined;
            alternateRefs?: {
                href: string;
                hreflang: string;
            }[] | undefined;
            images?: {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }[] | undefined;
            news?: {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            } | undefined;
        } | undefined;
        fromCrawl?: boolean | undefined;
        prerender?: {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined;
    }>, "many">>>;
    sitemap: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        host: z.ZodOptional<z.ZodString>;
        outputPath: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        outputPath: string;
        host?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        host?: string | undefined;
    }>>;
    prerender: z.ZodOptional<z.ZodIntersection<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        concurrency: z.ZodOptional<z.ZodNumber>;
        filter: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
            path: z.ZodString;
            sitemap: z.ZodOptional<z.ZodObject<{
                exclude: z.ZodOptional<z.ZodBoolean>;
                priority: z.ZodOptional<z.ZodNumber>;
                changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
                lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
                alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    href: z.ZodString;
                    hreflang: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    href: string;
                    hreflang: string;
                }, {
                    href: string;
                    hreflang: string;
                }>, "many">>;
                images: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    loc: z.ZodString;
                    caption: z.ZodOptional<z.ZodString>;
                    title: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }, {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }>, "many">>;
                news: z.ZodOptional<z.ZodObject<{
                    publication: z.ZodObject<{
                        name: z.ZodString;
                        language: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        name: string;
                        language: string;
                    }, {
                        name: string;
                        language: string;
                    }>;
                    publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
                    title: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                }, {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                }>>;
            }, "strip", z.ZodTypeAny, {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            }, {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            }>>;
            fromCrawl: z.ZodOptional<z.ZodBoolean>;
        } & {
            prerender: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodOptional<z.ZodBoolean>;
                outputPath: z.ZodOptional<z.ZodString>;
                autoSubfolderIndex: z.ZodOptional<z.ZodBoolean>;
                crawlLinks: z.ZodOptional<z.ZodBoolean>;
                retryCount: z.ZodOptional<z.ZodNumber>;
                retryDelay: z.ZodOptional<z.ZodNumber>;
                onSuccess: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
                    page: z.ZodObject<{
                        path: z.ZodString;
                        sitemap: z.ZodOptional<z.ZodObject<{
                            exclude: z.ZodOptional<z.ZodBoolean>;
                            priority: z.ZodOptional<z.ZodNumber>;
                            changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
                            lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
                            alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                                href: z.ZodString;
                                hreflang: z.ZodString;
                            }, "strip", z.ZodTypeAny, {
                                href: string;
                                hreflang: string;
                            }, {
                                href: string;
                                hreflang: string;
                            }>, "many">>;
                            images: z.ZodOptional<z.ZodArray<z.ZodObject<{
                                loc: z.ZodString;
                                caption: z.ZodOptional<z.ZodString>;
                                title: z.ZodOptional<z.ZodString>;
                            }, "strip", z.ZodTypeAny, {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }, {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }>, "many">>;
                            news: z.ZodOptional<z.ZodObject<{
                                publication: z.ZodObject<{
                                    name: z.ZodString;
                                    language: z.ZodString;
                                }, "strip", z.ZodTypeAny, {
                                    name: string;
                                    language: string;
                                }, {
                                    name: string;
                                    language: string;
                                }>;
                                publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
                                title: z.ZodString;
                            }, "strip", z.ZodTypeAny, {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            }, {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            }>>;
                        }, "strip", z.ZodTypeAny, {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        }, {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        }>>;
                        fromCrawl: z.ZodOptional<z.ZodBoolean>;
                    }, "strip", z.ZodTypeAny, {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    }, {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    }>;
                    html: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }>], z.ZodUnknown>, z.ZodAny>>;
                headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }, "strip", z.ZodTypeAny, {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            }, {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            sitemap?: {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            } | undefined;
            fromCrawl?: boolean | undefined;
            prerender?: {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            } | undefined;
        }, {
            path: string;
            sitemap?: {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            } | undefined;
            fromCrawl?: boolean | undefined;
            prerender?: {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            } | undefined;
        }>], z.ZodUnknown>, z.ZodAny>>;
        failOnError: z.ZodOptional<z.ZodBoolean>;
        autoStaticPathsDiscovery: z.ZodOptional<z.ZodBoolean>;
        maxRedirects: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        filter?: ((args_0: {
            path: string;
            sitemap?: {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            } | undefined;
            fromCrawl?: boolean | undefined;
            prerender?: {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            } | undefined;
        }, ...args: unknown[]) => any) | undefined;
        enabled?: boolean | undefined;
        concurrency?: number | undefined;
        failOnError?: boolean | undefined;
        autoStaticPathsDiscovery?: boolean | undefined;
        maxRedirects?: number | undefined;
    }, {
        filter?: ((args_0: {
            path: string;
            sitemap?: {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            } | undefined;
            fromCrawl?: boolean | undefined;
            prerender?: {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            } | undefined;
        }, ...args: unknown[]) => any) | undefined;
        enabled?: boolean | undefined;
        concurrency?: number | undefined;
        failOnError?: boolean | undefined;
        autoStaticPathsDiscovery?: boolean | undefined;
        maxRedirects?: number | undefined;
    }>, z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        outputPath: z.ZodOptional<z.ZodString>;
        autoSubfolderIndex: z.ZodOptional<z.ZodBoolean>;
        crawlLinks: z.ZodOptional<z.ZodBoolean>;
        retryCount: z.ZodOptional<z.ZodNumber>;
        retryDelay: z.ZodOptional<z.ZodNumber>;
        onSuccess: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
            page: z.ZodObject<{
                path: z.ZodString;
                sitemap: z.ZodOptional<z.ZodObject<{
                    exclude: z.ZodOptional<z.ZodBoolean>;
                    priority: z.ZodOptional<z.ZodNumber>;
                    changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
                    lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
                    alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                        href: z.ZodString;
                        hreflang: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        href: string;
                        hreflang: string;
                    }, {
                        href: string;
                        hreflang: string;
                    }>, "many">>;
                    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
                        loc: z.ZodString;
                        caption: z.ZodOptional<z.ZodString>;
                        title: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }, {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }>, "many">>;
                    news: z.ZodOptional<z.ZodObject<{
                        publication: z.ZodObject<{
                            name: z.ZodString;
                            language: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            name: string;
                            language: string;
                        }, {
                            name: string;
                            language: string;
                        }>;
                        publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
                        title: z.ZodString;
                    }, "strip", z.ZodTypeAny, {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    }, {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                }, {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                }>>;
                fromCrawl: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            }, {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            }>;
            html: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }>], z.ZodUnknown>, z.ZodAny>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    }, {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    }>>>>;
    spa: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        maskPath: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        prerender: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            outputPath: z.ZodOptional<z.ZodString>;
            autoSubfolderIndex: z.ZodOptional<z.ZodBoolean>;
            crawlLinks: z.ZodOptional<z.ZodBoolean>;
            retryCount: z.ZodOptional<z.ZodNumber>;
            retryDelay: z.ZodOptional<z.ZodNumber>;
            onSuccess: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
                page: z.ZodObject<{
                    path: z.ZodString;
                    sitemap: z.ZodOptional<z.ZodObject<{
                        exclude: z.ZodOptional<z.ZodBoolean>;
                        priority: z.ZodOptional<z.ZodNumber>;
                        changefreq: z.ZodOptional<z.ZodEnum<["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]>>;
                        lastmod: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
                        alternateRefs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                            href: z.ZodString;
                            hreflang: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            href: string;
                            hreflang: string;
                        }, {
                            href: string;
                            hreflang: string;
                        }>, "many">>;
                        images: z.ZodOptional<z.ZodArray<z.ZodObject<{
                            loc: z.ZodString;
                            caption: z.ZodOptional<z.ZodString>;
                            title: z.ZodOptional<z.ZodString>;
                        }, "strip", z.ZodTypeAny, {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }, {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }>, "many">>;
                        news: z.ZodOptional<z.ZodObject<{
                            publication: z.ZodObject<{
                                name: z.ZodString;
                                language: z.ZodString;
                            }, "strip", z.ZodTypeAny, {
                                name: string;
                                language: string;
                            }, {
                                name: string;
                                language: string;
                            }>;
                            publicationDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
                            title: z.ZodString;
                        }, "strip", z.ZodTypeAny, {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        }, {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        }>>;
                    }, "strip", z.ZodTypeAny, {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    }, {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    }>>;
                    fromCrawl: z.ZodOptional<z.ZodBoolean>;
                }, "strip", z.ZodTypeAny, {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                }, {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                }>;
                html: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }>], z.ZodUnknown>, z.ZodAny>>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        }, {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        }>>>, {
            enabled: boolean;
            outputPath: string;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks: boolean;
            retryCount: number;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        }, {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        prerender: {
            enabled: boolean;
            outputPath: string;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks: boolean;
            retryCount: number;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        };
        maskPath: string;
    }, {
        enabled?: boolean | undefined;
        prerender?: {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined;
        maskPath?: string | undefined;
    }>>;
    vite: z.ZodOptional<z.ZodObject<{
        installDevServerMiddleware: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        installDevServerMiddleware?: boolean | undefined;
    }, {
        installDevServerMiddleware?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    srcDirectory: string;
    start: {
        entry?: string | undefined;
    };
    router: {
        entry?: string | undefined;
        basepath?: string | undefined;
    } & {
        virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
        routeFilePrefix?: string | undefined;
        routeFileIgnorePrefix?: string | undefined;
        routeFileIgnorePattern?: string | undefined;
        routesDirectory?: string | undefined;
        quoteStyle?: "single" | "double" | undefined;
        semicolons?: boolean | undefined;
        disableLogging?: boolean | undefined;
        routeTreeFileHeader?: string[] | undefined;
        indexToken?: string | undefined;
        routeToken?: string | undefined;
        pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
        generatedRouteTree?: string | undefined;
        disableTypes?: boolean | undefined;
        addExtensions?: boolean | undefined;
        enableRouteTreeFormatting?: boolean | undefined;
        routeTreeFileFooter?: string[] | ((...args: unknown[]) => string[]) | undefined;
        customScaffolding?: {
            routeTemplate?: string | undefined;
            lazyRouteTemplate?: string | undefined;
        } | undefined;
        experimental?: {
            enableCodeSplitting?: boolean | undefined;
        } | undefined;
        plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
        tmpDir?: string | undefined;
        importRoutesUsingAbsolutePaths?: boolean | undefined;
        enableRouteGeneration?: boolean | undefined;
        codeSplittingOptions?: import('@tanstack/router-plugin').CodeSplittingOptions | undefined;
        plugin?: {
            vite?: {
                environmentName?: string | undefined;
            } | undefined;
        } | undefined;
    };
    client: {
        base: string;
        entry?: string | undefined;
    };
    server: {
        entry?: string | undefined;
    };
    serverFns: {
        base: string;
        generateFunctionId?: ((args_0: {
            filename: string;
            functionName: string;
        }, ...args: unknown[]) => string | undefined) | undefined;
    };
    pages: {
        path: string;
        sitemap?: {
            exclude?: boolean | undefined;
            priority?: number | undefined;
            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
            lastmod?: string | Date | undefined;
            alternateRefs?: {
                href: string;
                hreflang: string;
            }[] | undefined;
            images?: {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }[] | undefined;
            news?: {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            } | undefined;
        } | undefined;
        fromCrawl?: boolean | undefined;
        prerender?: {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined;
    }[];
    sitemap?: {
        enabled: boolean;
        outputPath: string;
        host?: string | undefined;
    } | undefined;
    prerender?: ({
        filter?: ((args_0: {
            path: string;
            sitemap?: {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            } | undefined;
            fromCrawl?: boolean | undefined;
            prerender?: {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            } | undefined;
        }, ...args: unknown[]) => any) | undefined;
        enabled?: boolean | undefined;
        concurrency?: number | undefined;
        failOnError?: boolean | undefined;
        autoStaticPathsDiscovery?: boolean | undefined;
        maxRedirects?: number | undefined;
    } & {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    }) | undefined;
    spa?: {
        enabled: boolean;
        prerender: {
            enabled: boolean;
            outputPath: string;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks: boolean;
            retryCount: number;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        };
        maskPath: string;
    } | undefined;
    vite?: {
        installDevServerMiddleware?: boolean | undefined;
    } | undefined;
}, {
    srcDirectory?: string | undefined;
    start?: {
        entry?: string | undefined;
    } | undefined;
    router?: ({
        entry?: string | undefined;
        basepath?: string | undefined;
    } & {
        virtualRouteConfig?: string | import('@tanstack/virtual-file-routes').VirtualRootRoute | undefined;
        routeFilePrefix?: string | undefined;
        routeFileIgnorePrefix?: string | undefined;
        routeFileIgnorePattern?: string | undefined;
        routesDirectory?: string | undefined;
        quoteStyle?: "single" | "double" | undefined;
        semicolons?: boolean | undefined;
        disableLogging?: boolean | undefined;
        routeTreeFileHeader?: string[] | undefined;
        indexToken?: string | undefined;
        routeToken?: string | undefined;
        pathParamsAllowedCharacters?: (";" | ":" | "@" | "&" | "=" | "+" | "$" | ",")[] | undefined;
        generatedRouteTree?: string | undefined;
        disableTypes?: boolean | undefined;
        addExtensions?: boolean | undefined;
        enableRouteTreeFormatting?: boolean | undefined;
        routeTreeFileFooter?: string[] | ((...args: unknown[]) => string[]) | undefined;
        customScaffolding?: {
            routeTemplate?: string | undefined;
            lazyRouteTemplate?: string | undefined;
        } | undefined;
        experimental?: {
            enableCodeSplitting?: boolean | undefined;
        } | undefined;
        plugins?: import('@tanstack/router-generator').GeneratorPlugin[] | undefined;
        tmpDir?: string | undefined;
        importRoutesUsingAbsolutePaths?: boolean | undefined;
        enableRouteGeneration?: boolean | undefined;
        codeSplittingOptions?: import('@tanstack/router-plugin').CodeSplittingOptions | undefined;
        plugin?: {
            vite?: {
                environmentName?: string | undefined;
            } | undefined;
        } | undefined;
    }) | undefined;
    client?: {
        entry?: string | undefined;
        base?: string | undefined;
    } | undefined;
    server?: {
        entry?: string | undefined;
    } | undefined;
    serverFns?: {
        base?: string | undefined;
        generateFunctionId?: ((args_0: {
            filename: string;
            functionName: string;
        }, ...args: unknown[]) => string | undefined) | undefined;
    } | undefined;
    sitemap?: {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        host?: string | undefined;
    } | undefined;
    prerender?: ({
        filter?: ((args_0: {
            path: string;
            sitemap?: {
                exclude?: boolean | undefined;
                priority?: number | undefined;
                changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                lastmod?: string | Date | undefined;
                alternateRefs?: {
                    href: string;
                    hreflang: string;
                }[] | undefined;
                images?: {
                    loc: string;
                    caption?: string | undefined;
                    title?: string | undefined;
                }[] | undefined;
                news?: {
                    title: string;
                    publication: {
                        name: string;
                        language: string;
                    };
                    publicationDate: string | Date;
                } | undefined;
            } | undefined;
            fromCrawl?: boolean | undefined;
            prerender?: {
                enabled?: boolean | undefined;
                outputPath?: string | undefined;
                autoSubfolderIndex?: boolean | undefined;
                crawlLinks?: boolean | undefined;
                retryCount?: number | undefined;
                retryDelay?: number | undefined;
                onSuccess?: ((args_0: {
                    page: {
                        path: string;
                        sitemap?: {
                            exclude?: boolean | undefined;
                            priority?: number | undefined;
                            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                            lastmod?: string | Date | undefined;
                            alternateRefs?: {
                                href: string;
                                hreflang: string;
                            }[] | undefined;
                            images?: {
                                loc: string;
                                caption?: string | undefined;
                                title?: string | undefined;
                            }[] | undefined;
                            news?: {
                                title: string;
                                publication: {
                                    name: string;
                                    language: string;
                                };
                                publicationDate: string | Date;
                            } | undefined;
                        } | undefined;
                        fromCrawl?: boolean | undefined;
                    };
                    html: string;
                }, ...args: unknown[]) => any) | undefined;
                headers?: Record<string, string> | undefined;
            } | undefined;
        }, ...args: unknown[]) => any) | undefined;
        enabled?: boolean | undefined;
        concurrency?: number | undefined;
        failOnError?: boolean | undefined;
        autoStaticPathsDiscovery?: boolean | undefined;
        maxRedirects?: number | undefined;
    } & {
        enabled?: boolean | undefined;
        outputPath?: string | undefined;
        autoSubfolderIndex?: boolean | undefined;
        crawlLinks?: boolean | undefined;
        retryCount?: number | undefined;
        retryDelay?: number | undefined;
        onSuccess?: ((args_0: {
            page: {
                path: string;
                sitemap?: {
                    exclude?: boolean | undefined;
                    priority?: number | undefined;
                    changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                    lastmod?: string | Date | undefined;
                    alternateRefs?: {
                        href: string;
                        hreflang: string;
                    }[] | undefined;
                    images?: {
                        loc: string;
                        caption?: string | undefined;
                        title?: string | undefined;
                    }[] | undefined;
                    news?: {
                        title: string;
                        publication: {
                            name: string;
                            language: string;
                        };
                        publicationDate: string | Date;
                    } | undefined;
                } | undefined;
                fromCrawl?: boolean | undefined;
            };
            html: string;
        }, ...args: unknown[]) => any) | undefined;
        headers?: Record<string, string> | undefined;
    }) | undefined;
    pages?: {
        path: string;
        sitemap?: {
            exclude?: boolean | undefined;
            priority?: number | undefined;
            changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
            lastmod?: string | Date | undefined;
            alternateRefs?: {
                href: string;
                hreflang: string;
            }[] | undefined;
            images?: {
                loc: string;
                caption?: string | undefined;
                title?: string | undefined;
            }[] | undefined;
            news?: {
                title: string;
                publication: {
                    name: string;
                    language: string;
                };
                publicationDate: string | Date;
            } | undefined;
        } | undefined;
        fromCrawl?: boolean | undefined;
        prerender?: {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined;
    }[] | undefined;
    spa?: {
        enabled?: boolean | undefined;
        prerender?: {
            enabled?: boolean | undefined;
            outputPath?: string | undefined;
            autoSubfolderIndex?: boolean | undefined;
            crawlLinks?: boolean | undefined;
            retryCount?: number | undefined;
            retryDelay?: number | undefined;
            onSuccess?: ((args_0: {
                page: {
                    path: string;
                    sitemap?: {
                        exclude?: boolean | undefined;
                        priority?: number | undefined;
                        changefreq?: "never" | "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | undefined;
                        lastmod?: string | Date | undefined;
                        alternateRefs?: {
                            href: string;
                            hreflang: string;
                        }[] | undefined;
                        images?: {
                            loc: string;
                            caption?: string | undefined;
                            title?: string | undefined;
                        }[] | undefined;
                        news?: {
                            title: string;
                            publication: {
                                name: string;
                                language: string;
                            };
                            publicationDate: string | Date;
                        } | undefined;
                    } | undefined;
                    fromCrawl?: boolean | undefined;
                };
                html: string;
            }, ...args: unknown[]) => any) | undefined;
            headers?: Record<string, string> | undefined;
        } | undefined;
        maskPath?: string | undefined;
    } | undefined;
    vite?: {
        installDevServerMiddleware?: boolean | undefined;
    } | undefined;
}>>>;
export type Page = z.infer<typeof pageSchema>;
export type TanStackStartInputConfig = z.input<typeof tanstackStartOptionsSchema>;
export type TanStackStartOutputConfig = ReturnType<typeof parseStartConfig>;
export {};
