import './index.css';

import { wgpu } from 'wgpu';
import { samples } from 'samples';
import { geometry } from 'constants';

(async () => {
    const handle = await wgpu.getHandle();
    const sample = samples.twoDimensions;
    const geo = geometry.quad();
    wgpu.renderLoop(handle, geo, sample.init, sample.draw);
})();