import { File } from "./Types";

export const migrateFile: (file: any) => File = (
    file
) => {
    return {
        ...file,
        label: file.label || file.title || "",
        summary: file.summary || file.description || "",
        provider: file.provider || file.attribution || "",
        rights: file.rights || file.license || "https://creativecommons.org/publicdomain/zero/1.0/",
        tags: file.tags || ["iiif"],
        metadata: file.metadata || {},
    };
};
