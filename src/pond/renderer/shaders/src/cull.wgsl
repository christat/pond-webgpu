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

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(0) @binding(1) var<storage, read> modelBoundingSphereStorage: array<ModelBoundingSphere>;
@group(0) @binding(2) var<storage, read_write> drawIndexedIndirectCommandStorage: array<DrawIndexedIndirectCommand>;

// Extract individual frustum planes from viewProjection matrix; intersect with model sphere
fn isModelVisible(viewProjection: mat4x4f, position: vec3f, radius: f32) -> bool {
	var planeIndex: u32 = 0;
	for (var i: u32 = 0; i < 3; i += 1) {
		for (var j: u32 = 0; j < 2; j += 1) {
			if (planeIndex == 2 || planeIndex == 3) {
				continue;
			}

			let sign: f32  = select(-1.0, 1.0, j > 0);
			var plane: vec4f = vec4f();
			
            for (var k: u32 = 0; k < 4; k += 1) {
			    plane[k] = viewProjection[k][3] + sign * viewProjection[k][i];
			}
			plane = plane / sqrt(dot(plane.xyz, plane.xyz));
			
            if (dot(position, plane.xyz) + plane.w + radius < 0) {
				return false;
			}

            planeIndex += 1;
		}
	}
	return true;
}

@compute @workgroup_size(64) fn cull(
    @builtin(global_invocation_id) id: vec3u
) {
    let i = id.x;
    if (i > globalUniform.modelCount) {
        return;
    }
    let modelBoundingSphere = modelBoundingSphereStorage[i];
    let modelVisible = isModelVisible(globalUniform.viewProjection, modelBoundingSphere.center, modelBoundingSphere.radius);
    drawIndexedIndirectCommandStorage[i].instanceCount = u32(select(0, 1, modelVisible));
}