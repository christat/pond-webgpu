struct CameraUniform {
    viewProjection: mat4x4f,
}

struct RenderObjectStorage {
    model: mat4x4f,
    textureIndex: u32,
}

struct VertexStorage {
    position: vec3f,
    uv: vec2f,
}

@group(0) @binding(0) var<uniform> camera: CameraUniform;
@group(0) @binding(1) var<storage, read> renderObjects: array<RenderObjectStorage>;
@group(0) @binding(2) var<storage, read> vertices: array<VertexStorage>;
@group(0) @binding(3) var textureSampler: sampler;
@group(0) @binding(4) var textures: texture_2d_array<f32>;

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) textureIndex: u32,
}

@vertex fn vs(
    @builtin(instance_index) drawIndex: u32, // NB! Drawindex not supported in WebGPU; (ab)using instancing and forgiving actual instances for now...
    @builtin(vertex_index) vertexIndex: u32,
) -> VSOutput {
    let renderObject = renderObjects[drawIndex];
    let vertex = vertices[vertexIndex];

    var vsOutput: VSOutput;
    vsOutput.position = camera.viewProjection * renderObject.model * vec4f(vertex.position, 1.0);
    vsOutput.uv = vertex.uv;
    vsOutput.textureIndex = renderObject.textureIndex;
    return vsOutput;
}

@fragment fn fs(vsOutput: VSOutput) -> @location(0) vec4f {
    return textureSample(textures, textureSampler, vsOutput.uv, vsOutput.textureIndex);
}