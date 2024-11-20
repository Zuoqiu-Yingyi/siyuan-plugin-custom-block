/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="@workspace/types/global" />

declare module "*.svelte" {
    export { SvelteComponent as default } from "svelte";
}
