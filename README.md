Pond (WebGPU edition)
=====================

Toying around with WebGPU as I had never had any exposure to web graphics, besides WebGL a lifetime ago.
The intent is learning modern graphics programming paradigms in a lower-threshold environment; WebGPU strikes a nice balance of Vulkan-like API while sparing all of the ancillary lower-level bookkeeping from you.

Progress (thus far)
===================
* GPU-driven content pipeline
  * Aggregate "scene-wide" buffers (vertex, index, model data, diffuse textureArray, etc.)
  * Compute cull prepass, using distance spheres and deconstructing viewProjection matrix into planes (https://www.gamedevs.org/uploads/fast-extraction-viewing-frustum-planes-from-world-view-projection-matrix.pdf)
  * multiDrawIndexedIndirect enabled on Chrome (expermiental flag, see: https://developer.chrome.com/blog/new-in-webgpu-131); fallback to drawIndexedIndirect
 
Wishlist
========
* GLTF loader integration
* lighting (phong model for starters)
* shadow mapping
* skybox/cubemaps
* transition towards PBR afterward

Credits
=======
Textures obtained from https://polyhaven.com/
* Wooden Garage Door, CC0 Dimitrios Sava
* Red Brick, CC0 Rob Tuytel
* Metal Plate, CC0 Rob Tuytel
