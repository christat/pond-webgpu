struct GlobalUniform {
    viewProjection: mat4x4f,
    modelCount: u32,
}

struct ModelBoundingSphere {
    center: vec3f,
    radius: f32,
}

struct DrawIndexedIndirectCommand {
	indexCount: u32,
	instanceCount: u32,
	firstIndex: u32,
	baseVertex: u32,
	firstInstance: u32
};

@group(0) @binding(0) var<uniform, read> globalUniform: GlobalUniform;
@group(0) @binding(1) var<storage, read> modelBindingSphereStorage: array<ModelBoundingSphere>;
@group(0) @binding(2) var<storage, write> drawIndexedIndirectCommandStorage: array<DrawIndexedIndirectCommand>;

// Extract individual frustum planes from viewProjection matrix; intersect with model sphere
fn isModelVisible(viewProjection: mat4f, position: vec3f, radius: f32) -> bool {
	let planeIndex: u32 = 0;
	for (let i: u32 = 0; i < 3; ++i) {
		for (let j: u32 = 0; j < 2; ++j, ++planeIndex) {
			if (planeIndex == 2 || planeIndex == 3) {
				continue;
			}

			const sign: f32  = select(-1, 1, j > 0);
			let plane: vec4f = vec4f();
			
            for (let k: u32 = 0; k < 4; ++k) {
			    plane[k] = viewProjection[k][3] + sign * viewProjection[k][i];
			}
			plane.xyzw /= sqrt(dot(plane.xyz, plane.xyz));
			
            if (dot(position, plane.xyz) + plane.w + radius < 0) {
				return false;
			}
		}
	}
	return true;
}

@compute @workgroup_size(64) fn cull(
    @builtin(global_invocation_id) id: vec3u
) {
    let i = id.x;
    if (id > globalUniform.modelCount) {
        return;
    }
    let modelBoundingSphere = modelBindingSphereStorage[id];
    let modelVisible = isModelVisible(globalUniform.viewProjection, modelBoundingSphere.center, modelBoundingSphere.radius);
    drawIndexedIndirectCommandStorage[id].instanceCount = select(0, 1, modelVisible);
}