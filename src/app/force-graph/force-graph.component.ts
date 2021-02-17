import * as d3 from 'd3';
import * as _ from 'lodash';
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FORCEDATA } from './utils/force-graph-data';

@Component({
    selector: 'app-force-graph',
    templateUrl: './force-graph.component.html',
    styleUrls: ['./force-graph.component.scss']
})
export class ForceGraphComponent implements OnInit {
    root: any;
    node: any;
    link: any;
    svg: any;
    simulation: any;
    i: number;
    
    @ViewChild('graphContainer', { static: true }) graphPreview: ElementRef;

    ngOnInit(): void {
        const width = this.graphPreview.nativeElement.offsetWidth;
        const height = this.graphPreview.nativeElement.offsetHeight;

        this.i = 0;

        this.root = d3.hierarchy(FORCEDATA);
        const transform = d3.zoomIdentity;

        this.svg = d3.select(this.graphPreview.nativeElement).append('svg')
        .style('width', '100vw')
        .style('height', '100vh')
            .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', () => this.zoomed()))
            .append('g')
            .attr('transform', 'translate(0,300)');



        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(function (d) { return d.id; }))
            .force('charge', d3.forceManyBody().strength(-15).distanceMax(300))
            .force('center', d3.forceCenter(width / 2, height / 4))
            .on('tick', () => this.ticked())

        this.update()
    }



    update() {
        const nodes = this.flatten(this.root)
        const links = this.root.links()

        this.link = this.svg
            .selectAll('.link')
            .data(links, function (d) { return d.target.id })

        this.link.exit().remove()

        const linkEnter = this.link
            .enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke', '#000')
            .style('opacity', '0.2')
            .style('stroke-width', 2)

        this.link = linkEnter.merge(this.link)

        this.node = this.svg
            .selectAll('.node')
            .data(nodes, function (d) { return d.id })

        this.node.exit().remove()

        const nodeEnter = this.node
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('stroke', '#666')
            .attr('stroke-width', 2)
            .style('fill', (d) => this.color(d))
            .style('opacity', 1)
            .on('click', (d) => this.clicked(d))
            .call(d3.drag()
                .on('start', (d) => this.dragstarted(d))
                .on('drag', (d) => this.dragged(d))
                .on('end', (d) => this.dragended(d)))

        nodeEnter.append('circle')
            .attr("r",  (d) => { return Math.sqrt(d.data.size) / 10 || 4.5; })
            .style('text-anchor', function (d) { return d.children ? 'end' : 'start'; })
            .text(function (d) { return d.data.name })

        this.node = nodeEnter.merge(this.node)
        this.simulation.nodes(nodes)
        this.simulation.force('link').links(links)
    }

    sizeContain(num) {
        num = num > 1000 ? num / 1000 : num / 100
        if (num < 4) num = 4
        return num
    }

    color(d) {
        return d._children ? "#51A1DC" // collapsed package
            : d.children ? "#51A1DC" // expanded package
                : "#F94B4C"; // leaf node
    }

    radius(d) {
        return d._children ? 8
            : d.children ? 8
                : 4
    }

    ticked() {
        if(this.link && this.node) {
        this.link
            .attr('x1', function (d) { return d.source.x; })
            .attr('y1', function (d) { return d.source.y; })
            .attr('x2', function (d) { return d.target.x; })
            .attr('y2', function (d) { return d.target.y; })

            this.svg.selectAll('.node')
            .attr('transform', function (d) {
              return 'translate(' + d.x + ', ' + d.y + ')';
            });
        }
    }

    clicked(d) {
        if (!d3.event.defaultPrevented) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            this.update()
        }
    }


    dragstarted(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
    }

    dragged(d) {
        d.fx = d3.event.x
        d.fy = d3.event.y
    }

    dragended(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
    }

    flatten(root) {
        const nodes = []
        const self = this;
        function recurse(node, self) {
            if (node.children) node.children.forEach(nodec => recurse(nodec, self))
            if (!node.id) node.id = ++self.i;
            else ++self.i;
            nodes.push(node)
        }
        recurse(root, self)
        return nodes
    }

    zoomed() {
        this.svg.attr('transform', d3.event.transform)
    }


}
