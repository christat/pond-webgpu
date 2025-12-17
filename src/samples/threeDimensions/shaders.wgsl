struct FSInput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
    @location(1) uv: vec2f,
}

struct InstanceData {
    transform: mat4x4f,
}

struct VertexData {
    position: vec3f,
    color: u32,
    uv: vec2f,
}

@group(0) @binding(0) var<uniform> instanceData: InstanceData;
@group(0) @binding(1) var<storage, read> vertices: array<VertexData>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var texture: texture_2d<f32>;

@vertex fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32,
) -> FSInput {
    let vertex = vertices[vertexIndex];

    var fsInput: FSInput;
    fsInput.position = instanceData.transform * vec4f(vertex.position, 1.0);
    fsInput.color = unpack4x8unorm(vertex.color);
    fsInput.uv = vertex.uv;
    return fsInput;
}

@fragment fn fs(fsInput: FSInput) -> @location(0) vec4f {
    return textureSample(texture, textureSampler, fsInput.uv);
}