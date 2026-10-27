import { Component, Input } from '@angular/core';
import { Edge, NgxGraphModule, Node } from '@swimlane/ngx-graph';
import { fechaEnMilisegundos, formatearFechaHora } from '../../../shared/presentacion/fecha-presentacion';
import { describirUbicacionFisica } from '../../../shared/presentacion/ubicacion-fisica-presentacion';
import { textoTipoMovimiento } from '../movimiento-fisico-presentacion';

@Component({
  selector: 'app-flujo-grafico-fisico',
  imports: [
    NgxGraphModule,
  ],
  templateUrl: './flujo-grafico-fisico.component.html',
  styleUrl: './flujo-grafico-fisico.component.scss'
})
export class FlujoGraficoFisicoComponent {
  @Input() tramite: any | null = null;
  @Input() historial: any[] = [];

  nodes: Node[] = [];
  links: Edge[] = [];

  readonly layout = 'dagre';

  readonly layoutSettings = {
    orientation: 'LR',
    rankPadding: 90,
    nodePadding: 45,
  };

  ngOnChanges(): void {
    this.construirFlujo();
  }

  private construirFlujo(): void {
    const historialOrdenado = Array.isArray(this.historial)
      ? [...this.historial].sort(
          (a, b) => fechaEnMilisegundos(a?.fecha_movimiento) - fechaEnMilisegundos(b?.fecha_movimiento),
        )
      : [];

    const nodos: Node[] = [];
    const enlaces: Edge[] = [];

    const nodoInicial = this.crearNodo(
      'inicio',
      'Ubicación base',
      this.describirUbicacion(this.tramite?.ubicacion_fisica),
      'INICIO',
      false,
      '',
      'Ubicación física asignada al expediente.',
    );

    nodos.push(nodoInicial);

    if (!historialOrdenado.length) {
      this.nodes = nodos;
      this.links = [];
      return;
    }

    historialOrdenado.forEach((movimiento, index) => {
      const nodeId = `movimiento-${movimiento?.id ?? index}`;
      const sourceId = index === 0
        ? 'inicio'
        : `movimiento-${historialOrdenado[index - 1]?.id ?? index - 1}`;

      const esUltimo = index === historialOrdenado.length - 1;

      nodos.push(
        this.crearNodo(
          nodeId,
          this.textoTipoMovimiento(movimiento?.tipo_movimiento),
          this.descripcionMovimiento(movimiento),
          movimiento?.tipo_movimiento,
          esUltimo,
          this.formatearFecha(movimiento?.fecha_movimiento),
          movimiento?.motivo || 'Sin motivo registrado',
        ),
      );

      enlaces.push({
        id: `enlace-${index}`,
        source: sourceId,
        target: nodeId,
        label: this.formatearFecha(movimiento?.fecha_movimiento),
        data: {
          motivo: movimiento?.motivo || 'Sin motivo registrado',
          fecha: movimiento?.fecha_movimiento ?? null,
          tipo: movimiento?.tipo_movimiento ?? null,
        },
      });
    });

    this.nodes = nodos;
    this.links = enlaces;
  }

  private crearNodo(
    id: string,
    label: string,
    detallePrincipal: string,
    tipo: string,
    esActual: boolean,
    fecha?: string,
    motivo?: string,
  ): Node {
    return {
      id,
      label,
      dimension: {
        width: 400,
        height: 155,
      },
      data: {
        detallePrincipal,
        fecha,
        motivo,
        tipo,
        esActual,
      },
    };
  }

  textoTipoMovimiento(tipo: string): string {
    return textoTipoMovimiento(tipo);
  }

  iconoTipoMovimiento(tipo: string): string {
    if (tipo === 'RETIRO') {
      return 'logout';
    }

    if (tipo === 'DEVOLUCION') {
      return 'assignment_return';
    }

    if (tipo === 'TRASLADO') {
      return 'sync_alt';
    }

    if (tipo === 'INICIO') {
      return 'inventory_2';
    }

    return 'radio_button_checked';
  }

  descripcionMovimiento(movimiento: any): string {
    if (!movimiento) {
      return 'Sin información';
    }

    if (movimiento.tipo_movimiento === 'RETIRO') {
      const persona = [
        movimiento?.nombre_persona,
        movimiento?.documento_persona,
      ].filter(Boolean).join(' - ');

      return persona || 'Retirado sin persona registrada';
    }

    if (movimiento.tipo_movimiento === 'DEVOLUCION') {
      return this.describirUbicacion(movimiento?.ubicacion_destino);
    }

    if (movimiento.tipo_movimiento === 'TRASLADO') {
      return this.describirUbicacion(movimiento?.ubicacion_destino);
    }

    return movimiento?.motivo || 'Movimiento registrado';
  }

  describirUbicacion(ubicacion: any): string {
    return describirUbicacionFisica(ubicacion);
  }

  formatearFecha(fecha: string | Date | null): string {
    return formatearFechaHora(fecha);
  }
}
