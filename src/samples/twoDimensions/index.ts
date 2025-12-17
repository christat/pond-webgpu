import {
    createTextureFromSource,
    getSizeAndAlignmentOfUnsizedArrayElement,
    loadImageBitmap,
    makeShaderDataDefinitions,
    makeStructuredView,
} from 'webgpu-utils';

import { WebGPUHandle } from 'wgpu';
import { ElementInfo } from 'wgpu/types';
import { Sample } from 'samples';
import { GeometryData } from 'constants';
import { mat4 } from 'wgpu-matrix';
import { m } from 'math';

import shaders from './shaders.wgsl';

interface VertexData {
    position: Float32Array<ArrayBuffer>,
    color: Uint32Array<ArrayBuffer>,
    uv: Float32Array<ArrayBuffer>,
}

export const twoDimensions: Sample = {
    init: async (handle: WebGPUHandle, geometry: GeometryData) => {
        const module = handle.device.createShaderModule({ label: 'triangle sample shader module', code: shaders });
        const shaderDefs = makeShaderDataDefinitions(shaders);

        const { vertexCount, vertexDimension, vertices, colors, uvs, transform } = geometry;
        handle.vertexCount = vertexCount;

        // fill transform uniform buffer
        const transformUniformBuffer = handle.device.createBuffer({
            label: 'transform uniform buffer',
            size: transform.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        handle.device.queue.writeBuffer(transformUniformBuffer, 0, transform.buffer);
        handle.uniformBuffer = transformUniformBuffer;

        // fetch vertex layout, fill CPU buffer
        const verticesMetadata = getSizeAndAlignmentOfUnsizedArrayElement(shaderDefs.storages.vertices) as ElementInfo;
        const verticesView = makeStructuredView(shaderDefs.storages.vertices, new ArrayBuffer(vertexCount * verticesMetadata.size));
        
        const colorDimension = 4;
        const uvDimension = 2;
        for(let i = 0; i < verticesView.views.length; ++i) {
            let { position, color, uv } = verticesView.views[i] as VertexData;

            // NB! needs custom view as shader exposes u32, but we want to pack 4xu8
            const colorU8View = new Uint8Array(color.buffer);

            const verticesOffset = i * vertexDimension;
            position.set(vertices.slice(verticesOffset, verticesOffset + vertexDimension));

            if (colors) {
                const colorsOffset = i * colorDimension;
                colorU8View.set(colors.slice(colorsOffset, colorsOffset + colorDimension), color.byteOffset);
            }

            if (uvs) {
                const uvOffset = i * uvDimension;
                uv.set(uvs.slice(uvOffset, uvOffset + uvDimension));
            }
        }

        // fill vertex storage buffer
        const vertexStorageBuffer = handle.device.createBuffer({
            label: 'triangle sample vertex storage buffer',
            size: verticesView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        handle.device.queue.writeBuffer(vertexStorageBuffer, 0, verticesView.arrayBuffer);

        // fill index buffer
        if(geometry.indices) {
            const indexBuffer = handle.device.createBuffer({
                label: 'triangle sample indices buffer',
                size: geometry.indices.length * 4,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
            });

            handle.device.queue.writeBuffer(indexBuffer, 0, geometry.indices);

            handle.indexBuffer = indexBuffer;
        } 

        // create texture sampler and fill texture buffer
        const sampler = handle.device.createSampler();
        const bitmap = await loadImageBitmap('assets/textures/wall.jpg');
        const textureBuffer = createTextureFromSource(handle.device, bitmap);
        
        // set pipeline
        const pipeline = handle.device.createRenderPipeline({
            label: 'triangle sample pipeline',
            primitive: {
                topology: 'triangle-list'
            },
            layout: 'auto',
            vertex: { module },
            fragment: { module, targets: [{ format: handle.format }] },
        });
        handle.pipelines.set('main', pipeline);

        // set bindGroups
        const bindGroup = handle.device.createBindGroup({
            label: 'triangle sample bindGroup',
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: transformUniformBuffer }},
                { binding: 1, resource: { buffer: vertexStorageBuffer }},
                { binding: 2, resource: sampler },
                { binding: 3, resource: textureBuffer.createView() },
            ],
        });
        handle.bindGroups.push(bindGroup);

        // set renderPass
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: 'triangle sample renderPass',
            colorAttachments: [
                {
                    view: handle.context.getCurrentTexture().createView(),
                    clearValue: [0.3, 0.3, 0.3, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };
        handle.renderPassDescriptors.set('main', renderPassDescriptor);
    },
    draw: (handle: WebGPUHandle, geometry: GeometryData) => {
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        const renderPassDescriptor = handle.renderPassDescriptors.get('main')!;
        (renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0].view =
            handle.context.getCurrentTexture().createView();

        const pipeline = handle.pipelines.get('main')!;


        // update transform uniform buffer
        if (handle.uniformBuffer) {
            const matrix = mat4.copy(geometry.transform);
            mat4.rotateZ(matrix, m.radians(handle.frame), matrix);
            mat4.translate(matrix, [Math.sin(handle.frame / 33), Math.cos(handle.frame / 33), 0], matrix);
            handle.device.queue.writeBuffer(handle.uniformBuffer, 0, matrix.buffer);
        }
        

        const encoder = handle.device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        if (handle.indexBuffer) pass.setIndexBuffer(handle.indexBuffer, 'uint32');
        handle.bindGroups.forEach((bindGroup, index) => pass.setBindGroup(index, bindGroup));
        handle.indexBuffer ? pass.drawIndexed(handle.vertexCount) : pass.draw(handle.vertexCount);
        pass.end();
        const commandBuffer = encoder.finish();

        handle.device.queue.submit([commandBuffer]);
    }
};