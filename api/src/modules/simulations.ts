import { z } from "zod";
import { clientError, fail, requireUser, requireWritable, type Module } from "../core.js";
import { parse, primitives as p } from "../validation.js";
import { calculators, simulationKinds, simulationParams, type SimulationKind } from "../simulate.js";

const typeDefs = /* GraphQL */ `
  enum SimulationKind { MORTGAGE LOAN MONTHLY_INVESTMENT INFLATION CAR RETIREMENT }

  type SimulationMetric {
    "Stable key the UI translates, e.g. monthlyPayment, totalInterest, finalValue."
    key: String!
    value: Float!
  }

  type SimulationPoint {
    "Year from today (0 = now)."
    period: Int!
    value: Float!
  }

  type SimulationResult {
    metrics: [SimulationMetric!]!
    series: [SimulationPoint!]!
  }

  type Simulation {
    id: ID!
    name: String!
    kind: SimulationKind!
    params: JSON!
    result: SimulationResult!
    createdAt: String!
  }

  extend type Query {
    "Run a calculator without saving. params depend on kind (see API docs)."
    simulate(kind: SimulationKind!, params: JSON!): SimulationResult!
    simulations: [Simulation!]!
  }

  extend type Mutation {
    saveSimulation(name: String!, kind: SimulationKind!, params: JSON!): Simulation!
    deleteSimulation(id: ID!): ID!
  }
`;

type SimulationRow = { id: number; name: string; kind: SimulationKind; params: unknown; created_at: string };

const kindSchema = z.enum(simulationKinds as [SimulationKind, ...SimulationKind[]]);
const nameSchema = z.string().trim().min(1).max(80);

function run(kind: SimulationKind, rawParams: unknown) {
  const params = parse(simulationParams[kind] as z.ZodType, rawParams);
  return { params, result: (calculators[kind] as (p: unknown) => ReturnType<(typeof calculators)["loan"]>)(params) };
}

const toSimulation = (row: SimulationRow) => ({
  id: row.id,
  name: row.name,
  kind: row.kind,
  params: row.params,
  // Recomputed on read: a formula fix updates every saved simulation.
  result: run(row.kind, row.params).result,
  createdAt: row.created_at,
});

export const simulations: Module = {
  typeDefs,
  resolvers: {
    SimulationKind: {
      MORTGAGE: "mortgage", LOAN: "loan", MONTHLY_INVESTMENT: "monthly_investment",
      INFLATION: "inflation", CAR: "car", RETIREMENT: "retirement",
    },

    Query: {
      simulate: (_, args: { kind: string; params: unknown }, ctx) => {
        requireUser(ctx);
        return run(parse(kindSchema, args.kind), args.params).result;
      },

      simulations: async (_, __, ctx) => {
        const user = requireUser(ctx);
        const { data, error } = await user.db
          .from("simulations")
          .select("id, name, kind, params, created_at")
          .eq("user_id", user.userId)
          .order("created_at", { ascending: false });
        if (error) fail(error);
        return (data as SimulationRow[]).map(toSimulation);
      },
    },

    Mutation: {
      saveSimulation: async (_, args: { name: string; kind: string; params: unknown }, ctx) => {
        const user = await requireWritable(ctx);
        const kind = parse(kindSchema, args.kind);
        const name = parse(nameSchema, args.name);
        const { params } = run(kind, args.params);
        const { data, error } = await user.db
          .from("simulations")
          .insert({ user_id: user.userId, name, kind, params })
          .select("id, name, kind, params, created_at")
          .single<SimulationRow>();
        if (error) fail(error);
        return toSimulation(data);
      },

      deleteSimulation: async (_, args: { id: string }, ctx) => {
        const user = await requireWritable(ctx);
        const id = parse(p.id, args.id);
        const { data, error } = await user.db.from("simulations").delete().eq("id", id).eq("user_id", user.userId).select("id");
        if (error) fail(error);
        if (data.length === 0) throw clientError("No encontrado", "NOT_FOUND");
        return id;
      },
    },
  },
};
