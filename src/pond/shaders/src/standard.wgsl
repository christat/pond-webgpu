struct ViewUniforms {
    transform: mat4x4f,
}

struct ModelUniforms {
    transform: mat4x4f,
}

struct VertexStorage {
    position: vec3f,
    uv: vec2f,
}

@group(0) @binding(0) var<uniform> viewUniforms: ViewUniforms;
@group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;
@group(0) @binding(2) var<storage, read> vertexStorage: array<VertexStorage>;
@group(0) @binding(3) var textureSampler: sampler;
@group(0) @binding(4) var texture: texture_2d<f32>;

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

@vertex fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32,
) -> VSOutput {
    let vertex = vertexStorage[vertexIndex];

    var vsOutput: VSOutput;
    vsOutput.position = viewUniforms.transform * modelUniforms.transform * vec4f(vertex.position, 1.0);
    vsOutput.uv = vertex.uv;
    return vsOutput;
}

@fragment fn fs(vsOutput: VSOutput) -> @location(0) vec4f {
    return textureSample(texture, textureSampler, vsOutput.uv);
}