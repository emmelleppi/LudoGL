# LudoGL

LudoGL is a WebGL2-only renderer built from scratch for learning purposes.
The renderer and its APIs are primarily inspired by [Three.js](https://threejs.org/) and [OGL](https://github.com/oframe/ogl).

![LudoGL Screenshot](/LudoGL.jpg)

## Disclaimer

This library is a personal learning project focused on understanding deferred rendering and post-processing effects in WebGL2. It is **not** intended to be a production-ready or maintained rendering engine.

Important limitations to note:

- This is WebGL2-only with no fallbacks for unsupported extensions or older devices
- No scene graph implementation
- Limited WebGL feature detection and error handling
- Missing many common developer tools and utilities
- May not work on many devices/GPUs due to high requirements
- Some post-processing passes have been customized for the demo scene and may require modifications for general use

The goal is purely educational - to learn modern rendering techniques through implementation. This is not meant to be a lightweight alternative to established libraries like Three.js, OGL, Babylon.js, etc

## Motivation

While reading articles about deferred rendering in AAA games, I came across this fascinating breakdown of Resident Evil's rendering pipeline:

[Behind the Pretty Frames: Resident Evil](https://mamoniem.com/behind-the-pretty-frames-resident-evil/)

Initially intimidated by such a complex rendering pipeline, I decided to challenge myself to implement it from scratch, step by step. This project represents my learning journey - combining knowledge from various tutorials, studying other implementations, and adapting techniques from more experienced developers.

The codebase borrows from various great resources and implementations I studied (thanks to all the original authors!).

## Features

### Rendering Pipeline

The renderer implements a modern deferred rendering pipeline with the following stages:

1. **Environment Map Generation Pass**

    - Creates three essential textures for image-based lighting (IBL):
        - Environment cube map (256x256 per face)
        - Diffuse irradiance cube map (64x64 per face)
        - BRDF LUT (256x256) for specular IBL
    - Uses a cube camera to capture the scene from six directions
    - Generates mipmaps for the specular environment map based on roughness levels

2. **G-Buffer Pass**

    - Stores geometry information in multiple render targets:
        - Albedo + metalness (RGBA8 - 8x4 = 32 bits)
        - View Normal + packed(roughness + shadow + bloom intensity) (RGBA16F - 16x4 = 64 bits)
        - Emissive + AO Baked (RGBA8 - 8x4 = 32 bits)
        - TAA velocity (RG16F - 16x2 = 32 bits)
        - Depth (DEPTH_COMPONENT24 - 24 bits)

    * Shadowmap (DEPTH_COMPONENT16 - 16 bits)

3. **Lighting Pass**

    - Processes all lights in the scene
    - Applies lighting calculations using the G-Buffer data

4. **Post-Processing Effects**
   The renderer includes several high-quality post-processing effects:

    - **Temporal Anti-Aliasing (TAA)**

        - Based on multiple industry-standard implementations:
            - [Temporal Anti-Aliasing Tutorial](https://sugulee.wordpress.com/2021/06/21/temporal-anti-aliasingtaa-tutorial/)
            - [TAA Step by Step](https://ziyadbarakat.wordpress.com/2020/07/28/temporal-anti-aliasing-step-by-step/)
            - [TAA and the Quest for the Holy Trail](https://www.elopezr.com/temporal-aa-and-the-quest-for-the-holy-trail/)
        - Uses Halton sequence for sub-pixel jittering
        - Implements velocity-based history reprojection
        - Includes clipping and anti-ghosting techniques

    - **FXAA (Fast Approximate Anti-Aliasing)**

        - Based on [Three.js FXAA implementation](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/FXAAShader.js)
        - Fast and efficient post-process anti-aliasing
        - Minimal performance impact

    - **GTAO (Ground Truth Ambient Occlusion)**

        - Based on:
            - [Asylum Tutorials GTAO](https://github.com/asylum2010/Asylum_Tutorials/blob/master/ShaderTutors/54_GTAO/)
            - [Three.js GTAO Pass](https://github.com/gkjohnson/threejs-sandbox/tree/master/gtaoPass)
        - Includes color bounce for more realistic ambient lighting

    - **TransparentForwardPass**

        - Handles transparent objects like glass orbs
        - Includes blur pass for frosted glass effect
        - Properly handles depth testing with opaque geometry

    - **Screen Space Reflections (SSR)**

        - Based on:
            - [Casual Effects](https://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html)
            - [Will PGfx](https://willpgfx.com/2015/07/screen-space-glossy-reflections/)
            - [Babylon.js SSR](https://github.com/BabylonJS/Babylon.js/blob/7aee9a791e1427deab6e83a339d1594171fa62cf/packages/dev/core/src/Shaders/screenSpaceReflection2.fragment.fx#L55)
            - [Hi-Z Tracing Method](https://sugulee.wordpress.com/2021/01/19/screen-space-reflections-implementation-and-optimization-part-2-hi-z-tracing-method/)
            - [gkjohnson Three.js SSR Pass](https://github.com/gkjohnson/threejs-sandbox/tree/a355ac0fb9212ba13a4dd01b804d45f21d72c289/screenSpaceReflectionsPass)
        - Implements Hi-Z tracing for better performance (not used in this demo)
        - Includes blur pass for smooth reflections

    - **Bloom**

        - Based on:
            - [John Chapman's Pseudo Lens Flare](https://john-chapman.github.io/2017/11/05/pseudo-lens-flare.html)
            - [Postprocessing Bloom Effect](https://github.com/pmndrs/postprocessing/blob/fc9ed867f2b0f954e5329545e6c58b1a60f399f0/src/effects/BloomEffect.js)
            - [UE4 Custom Bloom](https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/)
            - [Screen Space Lens Flare](https://github.com/JamShan/GfxSamples/tree/master/data/LensFlare_ScreenSpace)
        - Implements lens flare and ghost effects
        - Includes starburst and gradient effects

    - **Motion Blur**

        - Based on:
            - [Realism Effects Motion Blur](https://github.com/0beqz/realism-effects/tree/main/src/motion-blur)
            - [Motion Blur Implementation](https://aminaliari.github.io/posts/motionblur/)
        - Velocity-based motion blur using motion vectors
        - Tiled velocity buffer with neighbor max sampling for better performance

    - **Output Pass**
        - Barrel lens distortion
        - Sharpening
        - Vignette effect
        - ACES Filmic tone mapping
        - Color space conversion (Linear to sRGB)
        - Blue noise dithering

## Getting Started

1. Clone the repository
2. Install dependencies:
    ```bash
    pnpm install
    ```
3. Start the development server:
    ```bash
    pnpm dev
    ```

## Dependencies

- Vite for build tooling
- WebGL2 for rendering
- npm/pnpm/whatever for package management
