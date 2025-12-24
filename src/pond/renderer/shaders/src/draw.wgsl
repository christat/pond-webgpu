struct GlobalUniform {
    viewProjection: mat4x4f,
    modelCount: u32,
}

struct VertexStorage {
    position: vec3f,
    uv: vec2f,
}

@group(0) @binding(0) var<uniform> global: GlobalUniform;
@group(0) @binding(1) var<storage, read> vertexStorage: array<VertexStorage>;
@group(0) @binding(2) var diffuseArray: texture_2d_array<f32>;
@group(0) @binding(3) var textureSampler: sampler;

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) textureIndex: u32,
}

@vertex fn vs(
    @builtin(vertex_index) vertexIndex: u32,
) -> VSOutput {
    let vertex = vertexStorage[vertexIndex];

    var vsOutput: VSOutput;
    vsOutput.position = global.viewProjection * vec4f(vertex.position, 1.0);
    vsOutput.uv = vertex.uv;
    vsOutput.textureIndex = 0;
    return vsOutput;
}

@fragment fn fs(vsOutput: VSOutput) -> @location(0) vec4f {
    return textureSample(diffuseArray, textureSampler, vsOutput.uv, vsOutput.textureIndex);
}