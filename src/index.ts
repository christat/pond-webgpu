import './index.css';

import { wgpu } from 'wgpu';
import { samples } from 'samples';
import { geometry } from 'constants';
import { mat4 } from 'wgpu-matrix';
import { m } from 'math';

(async () => {
    const handle = await wgpu.getHandle();
    const sample = samples.threeDimensions;

    const transform = mat4.rotationX(m.radians(-55));
    const geo = geometry.quad(transform);
    wgpu.renderLoop(handle, geo, sample.init, sample.draw);
})();