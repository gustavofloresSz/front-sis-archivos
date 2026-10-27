import { Component, Input, OnChanges } from '@angular/core';
import { Edge, NgxGraphModule, Node } from '@swimlane/ngx-graph';
import { obtenerEstadoTramiteVisual } from '../../shared/estado-tramite-presentacion';
import { formatearFechaHora } from '../../../shared/presentacion/fecha-presentacion';
import {
  nombreResponsableEstado,
  ordenarHistorialEstados,
} from '../../shared/historial-estado-presentacion';

@Component({
  selector: 'app-workflow-grafico-tramite',
  imports: [NgxGraphModule],
  templateUrl: './workflow-grafico-tramite.component.html',
  styleUrl: './workflow-grafico-tramite.component.scss',
})
export class WorkflowGraficoTramiteComponent implements OnChanges {
  @Input() historial: any[] = [];
  @Input() estadoActual: any | null = null;

  nodes: Node[] = [];
  links: Edge[] = [];

  readonly layout = 'dagre';
  readonly layoutSettings = {
    orientation: 'LR',
    rankPadding: 80,
    nodePadding: 40,
  };

  ngOnChanges(): void {
    this.construirGrafo();
  }

  private construirGrafo(): void {
    const historialOrdenado = Array.isArray(this.historial)
      ? ordenarHistorialEstados(this.historial)
      : [];

    if (!historialOrdenado.length) {
      this.nodes = [];
      this.links = [];
      return;
    }

    const nodos: Node[] = [
      this.crearNodo('inicio', 'Inicio', {
        esActual: false,
        esInicio: true,
        esFin: false,
      }),
    ];
    const estadoActualId = this.estadoActual?.id;

    const enlaces = historialOrdenado
      .map((cambio, index): Edge | null => {
        const estadoNuevo = cambio?.estado_nuevo;

        if (estadoNuevo?.id == null) {
          return null;
        }

        const target = this.idEvento(cambio, index);
        const source = index === 0
          ? 'inicio'
          : this.idEvento(historialOrdenado[index - 1], index - 1);
        const motivoCompleto =
          String(cambio?.motivo ?? '').trim() || 'Sin motivo registrado';
        const esUltimo = index === historialOrdenado.length - 1;
        const estadoVisual = obtenerEstadoTramiteVisual(estadoNuevo?.nombre);

        nodos.push(
          this.crearNodo(target, estadoNuevo?.nombre ?? 'Estado sin nombre', {
            esActual:
              esUltimo &&
              this.mismoEstado(estadoNuevo?.id, estadoActualId),
            esInicio: false,
            esFin: false,
            orden: index + 1,
            estadoVisual,
            procedencia: cambio?.estado_anterior?.nombre
              ? `Desde ${cambio.estado_anterior.nombre}`
              : 'Estado inicial',
            fecha: this.formatearFecha(cambio?.fecha_cambio),
            motivo: this.recortarTexto(motivoCompleto, 32),
            motivoCompleto,
            responsable: this.recortarTexto(
              this.nombreResponsable(cambio),
              30,
            ),
          }),
        );

        return {
          id: `transicion-${cambio?.id ?? index}-${index}`,
          source,
          target,
          label: '',
          data: {
            motivoCompleto,
            fechaCambio: cambio?.fecha_cambio ?? null,
            responsable: this.nombreResponsable(cambio),
            esCierre: false,
          },
        };
      })
      .filter((link): link is Edge => link !== null);

    const ultimoCambio = historialOrdenado.at(-1);
    const ultimoEstadoVisual = obtenerEstadoTramiteVisual(
      ultimoCambio?.estado_nuevo?.nombre,
    );

    if (this.esEstadoTerminal(ultimoEstadoVisual) && nodos.length > 1) {
      const ultimoNodo = nodos.at(-1)!;

      nodos.push(
        this.crearNodo('fin', 'Fin', {
          esActual: false,
          esInicio: false,
          esFin: true,
          estadoVisual: ultimoEstadoVisual,
        }),
      );

      enlaces.push({
        id: 'transicion-fin',
        source: ultimoNodo.id,
        target: 'fin',
        label: '',
        data: { esCierre: true },
      });
    }

    this.nodes = nodos;
    this.links = enlaces;
  }

  private crearNodo(
    id: string,
    label: string,
    data: Record<string, unknown>,
  ): Node {
    const esEvento = data['esInicio'] === true || data['esFin'] === true;

    return {
      id,
      label,
      dimension: esEvento
        ? { width: 58, height: 104 }
        : { width: 360, height: 190 },
      data,
    };
  }

  private idEvento(cambio: any, index: number): string {
    return `historial-${String(cambio?.id ?? index)}`;
  }

  private mismoEstado(id: unknown, estadoActualId: unknown): boolean {
    return id != null && estadoActualId != null && String(id) === String(estadoActualId);
  }

  private esEstadoTerminal(estado: string): boolean {
    return ['concluido', 'anulado', 'abandono'].includes(estado);
  }

  private formatearFecha(fecha: string | Date | null): string {
    return formatearFechaHora(fecha, 'Sin fecha registrada');
  }

  private nombreResponsable(cambio: any): string {
    return nombreResponsableEstado(cambio, 'Responsable no disponible');
  }

  private recortarTexto(valor: unknown, maximo: number): string {
    const texto = String(valor ?? '').trim();

    if (!texto) {
      return 'Sin información';
    }

    return texto.length > maximo
      ? `${texto.slice(0, maximo - 3)}...`
      : texto;
  }
}
