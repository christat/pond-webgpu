struct GlobalUniform {
    viewProjection: mat4x4f,
    modelCount: u32,
}

struct ModelStorage {
    transform: mat4x4f,
    diffuseIndex: u32,
}

struct VertexStorage {
    position: vec3f,
    uv: vec2f,
}

@group(0) @binding(0) var<uniform> global: GlobalUniform;
@group(0) @binding(1) var<storage, read> modelStorage: array<ModelStorage>;
@group(0) @binding(2) var<storage, read> vertexStorage: array<VertexStorage>;
@group(0) @binding(3) var diffuseArray: texture_2d_array<f32>;
@group(0) @binding(4) var textureSampler: sampler;

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) @interpolate(flat) diffuseIndex: u32
}

@vertex fn vs(
    @builtin(instance_index) modelIndex: u32, // NB! Hack: use instanceIndex as "drawIndex"; we sacrifice instancing in exchange for per-model buffer indexing.
    @builtin(vertex_index) vertexIndex: u32,
) -> VSOutput {
    let model = modelStorage[modelIndex];
    let vertex = vertexStorage[vertexIndex];

    var vsOutput: VSOutput;
    vsOutput.position = global.viewProjection * model.transform * vec4f(vertex.position, 1.0);
    vsOutput.uv = vertex.uv;
    vsOutput.diffuseIndex = model.diffuseIndex;
    return vsOutput;
}

@fragment fn fs(vsOutput: VSOutput) -> @location(0) vec4f {
    return textureSample(diffuseArray, textureSampler, vsOutput.uv, vsOutput.diffuseIndex);
}