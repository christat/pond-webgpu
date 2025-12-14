import {
    getSizeAndAlignmentOfUnsizedArrayElement,
    makeShaderDataDefinitions,
    makeStructuredView,
    makeTypedArrayViews,
} from 'webgpu-utils';

import { WebGPUHandle } from 'wgpu';
import { ElementInfo } from 'wgpu/types';
import { Sample } from 'samples';
import { geometry, GeometryData } from 'constants';

const shaders = /*wgsl*/`
    struct FSInput {
        @builtin(position) position: vec4f,
        @location(0) color: vec4f,
    }

    struct VertexData {
        position: vec3f,
        color: u32,
    }
    @group(0) @binding(0) var<storage, read> vertices: array<VertexData>;

    @vertex fn vs(
        @builtin(vertex_index) vertexIndex: u32,
        @builtin(instance_index) instanceIndex: u32,
    ) -> FSInput {
        let vertex = vertices[vertexIndex];

        var fsInput: FSInput;
        fsInput.position = vec4f(vertex.position, 1.0);
        fsInput.color = unpack4x8unorm(vertex.color);
        return fsInput;
    }

    @fragment fn fs(fsInput: FSInput) -> @location(0) vec4f {
        return fsInput.color;
    }
`;

interface VertexData {
    position: Float32Array<ArrayBuffer>,
    color: Uint8Array<ArrayBuffer>,
}

export const twoDimensions: Sample = {
    init: (handle: WebGPUHandle, geometry: GeometryData) => {
        const module = handle.device.createShaderModule({ label: 'triangle sample shader module', code: shaders });
        const shaderDefs = makeShaderDataDefinitions(shaders);

        const { vertexCount, vertexDimension, vertices, colors } = geometry;
        handle.vertexCount = vertexCount;

        // fill vertex storage buffer
        const verticesMetadata = getSizeAndAlignmentOfUnsizedArrayElement(shaderDefs.storages.vertices) as ElementInfo;
        const verticesView = makeStructuredView(shaderDefs.storages.vertices, new ArrayBuffer(vertexCount * verticesMetadata.size));
        
        const colorDimension = 4;
        for(let i = 0; i < verticesView.views.length; ++i) {
            let { position, color } = verticesView.views[i] as VertexData;

            const verticesOffset = i * vertexDimension;
            position.set(vertices.slice(verticesOffset, verticesOffset + vertexDimension));

            if (colors) {
                const colorsOffset = i * colorDimension;
                const slice = colors.slice(colorsOffset, colorsOffset + colorDimension);
                color.set([255]); // TODO investigate why packing Uint8Array[4] here overflows
            }
        }

        const vertexStorageBuffer = handle.device.createBuffer({
            label: 'triangle sample vertex storage buffer',
            size: verticesView.arrayBuffer.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        handle.device.queue.writeBuffer(vertexStorageBuffer, 0, verticesView.arrayBuffer);

        // fill index storage buffer
        if(geometry.indices) {
            const indexBuffer = handle.device.createBuffer({
                label: 'triangle sample indices buffer',
                size: geometry.indices.length * 4,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
            });

            handle.device.queue.writeBuffer(indexBuffer, 0, geometry.indices);

            handle.indexBuffer = indexBuffer;
        } 
        
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
                { binding: 0, resource: { buffer: vertexStorageBuffer }},
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