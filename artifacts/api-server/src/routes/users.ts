import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { UpdateUserBody, ToggleBlockUserBody, ListUsersQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();
const ASSIGNABLE_ROLES = new Set(["customer", "staff", "super_admin"]);

function formatUser(user: typeof usersTable.$inferSelect) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, isBlocked: user.isBlocked, createdAt: user.createdAt };
}

router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const { page = 1, limit = 20 } = params.success ? params.data : { page: 1, limit: 20 };

  const allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  const total = allUsers.length;
  const users = allUsers.slice((page - 1) * limit, page * limit).map(formatUser);
  res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
});

router.get("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.put("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.role != null) {
    const nextRole = String(parsed.data.role);
    if (!ASSIGNABLE_ROLES.has(nextRole)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    if (req.user?.role !== "super_admin") {
      res.status(403).json({ error: "Only super admin can change roles" });
      return;
    }
    updateData.role = nextRole;
  }

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

router.put("/users/:id/block", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = ToggleBlockUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set({ isBlocked: parsed.data.isBlocked }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

export default router;
