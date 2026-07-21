import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash, CheckSquare, MessageSquare, Clock, User, AlertCircle, Calendar, ArrowRight, UserPlus, Info } from 'lucide-react';
import { useTaskBoard } from '../hooks/useTaskBoard';
import { useProjectPermissions } from '../hooks/useProjectPermissions';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-100 border-slate-200' },
  { id: 'todo', label: 'To Do', color: 'bg-blue-50/20 border-blue-100' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-amber-50/20 border-amber-100' },
  { id: 'in-review', label: 'In Review', color: 'bg-purple-50/20 border-purple-100' },
  { id: 'done', label: 'Done', color: 'bg-emerald-50/20 border-emerald-100' }
];

export default function TaskBoard({ projectId, permissions }) {
  const { board = {}, isLoading, createTask, updateTaskStatus, deleteTask, addTaskComment } = useTaskBoard(projectId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form State for creating task
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium' });

  // Comment State
  const [commentText, setCommentText] = useState('');

  // Fetch project team members for assignees
  const { data: teamData } = useQuery({
    queryKey: ['project:members', projectId],
    queryFn: async () => {
      const res = await projectService.listMembers(projectId);
      return res.data;
    },
    enabled: !!projectId
  });
  const members = teamData?.docs || [];

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await createTask(newTask);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium' });
      setShowCreateModal(false);
    } catch (err) {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;

    try {
      await addTaskComment({ taskId: selectedTask._id, content: commentText });
      setCommentText('');
      // Refresh selected task info
      const res = await projectService.getTaskDetails(projectId, selectedTask._id);
      setSelectedTask(res.data);
    } catch (err) {}
  };

  const openTaskDetail = async (task) => {
    try {
      const res = await projectService.getTaskDetails(projectId, task._id);
      setSelectedTask(res.data);
    } catch (err) {
      setSelectedTask(task);
    }
  };

  return (
    <div className="space-y-6">
      {/* Board Header Actions */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800">Task Board</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage tasks in Kanban columns and track sprint velocity</p>
        </div>
        {permissions.canManageTasks && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1 bg-blue-650 text-white px-3.5 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={14} /> Add Task
          </button>
        )}
      </div>

      {/* Kanban Board Grid */}
      {isLoading ? (
        <p className="text-xs text-slate-400 font-semibold italic text-center py-6">Loading board...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start overflow-x-auto min-h-[500px]">
          {COLUMNS.map((col) => {
            const tasks = board[col.id] || [];
            return (
              <div key={col.id} className="bg-slate-100/60 rounded-2xl p-3 border border-slate-200 min-w-[200px] flex flex-col h-full">
                {/* Column Title */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-black text-slate-700">{col.label}</span>
                  <span className="bg-slate-250 text-slate-550 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {tasks.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-[10px] text-slate-400 font-semibold italic">
                      No tasks
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task._id}
                        onClick={() => openTaskDetail(task)}
                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:shadow-sm cursor-pointer transition space-y-3"
                      >
                        <div>
                          <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                            task.priority === 'critical' || task.priority === 'high' ? 'bg-red-50 text-red-650' : 'bg-slate-100 text-slate-550'
                          }`}>
                            {task.priority}
                          </span>
                          <h4 className="text-xs font-extrabold text-slate-800 mt-1.5 leading-snug break-words">
                            {task.title}
                          </h4>
                        </div>

                        {/* Footer (Assignee + Info) */}
                        <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-semibold">
                          <div className="flex items-center gap-1.5">
                            {task.assignees?.map((a) => (
                              <div key={a._id} className="w-5 h-5 rounded-full bg-slate-50 text-slate-650 border border-white flex items-center justify-center font-bold text-[9px] uppercase ring-1 ring-slate-100">
                                {a.firstName?.charAt(0) || 'A'}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {task.commentCount > 0 && (
                              <span className="flex items-center gap-0.5"><MessageSquare size={10} />{task.commentCount}</span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-0.5 text-slate-500 font-bold"><Clock size={10} />{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Action: Move Status */}
                        {permissions.canManageTasks && col.id !== 'done' && (
                          <div className="pt-2 border-t border-slate-50 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextStatuses = { backlog: 'todo', todo: 'in-progress', 'in-progress': 'in-review', 'in-review': 'done' };
                                const next = nextStatuses[col.id];
                                if (next) updateStatusStatus(task._id, next);
                              }}
                              className="text-[9px] font-black text-blue-650 hover:text-blue-700 inline-flex items-center gap-0.5"
                            >
                              Move status <ArrowRight size={8} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTask} className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-slate-900">Create Workspace Task</h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Task Title</label>
              <input
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="What needs to be done?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />

              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Add more details about this task..."
                rows="3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-650 text-white px-4 py-2 text-xs font-black shadow-md hover:bg-blue-700"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Details / Comment Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                  selectedTask.priority === 'critical' || selectedTask.priority === 'high' ? 'bg-red-50 text-red-650' : 'bg-slate-100 text-slate-550'
                }`}>
                  {selectedTask.priority}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold ml-2 capitalize">Status: {selectedTask.status}</span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Close
              </button>
            </div>

            {/* Scrollable details and comment logs */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">{selectedTask.title}</h3>
                <p className="text-xs text-slate-555 mt-2 leading-relaxed whitespace-pre-line bg-slate-50/50 rounded-xl p-3.5 border">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Checklist */}
              {selectedTask.checklist?.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2">Checklist</h4>
                  <div className="space-y-2">
                    {selectedTask.checklist.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {}}
                          className="rounded text-blue-600 w-3.5 h-3.5"
                        />
                        <span>{item.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Comments */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-800">Task Comments</h4>
                
                {selectedTask.comments?.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-semibold italic">No comments on this task.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedTask.comments?.map((c, idx) => (
                      <div key={idx} className="bg-slate-50/50 border rounded-xl p-2.5 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>{c.userId?.fullName || 'Collaborator'}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-700">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddComment} className="flex gap-2 items-center pt-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add comment..."
                    className="flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white"
                  />
                  <button type="submit" className="bg-blue-650 text-white rounded-xl px-3 py-2 text-xs font-bold shadow-sm">
                    Post
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Actions */}
            {permissions.canManageTasks && (
              <div className="border-t border-slate-100 pt-4 flex justify-between shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Delete this task?')) {
                      await deleteTask(selectedTask._id);
                      setSelectedTask(null);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-xs font-bold hover:bg-red-50"
                >
                  <Trash size={13} /> Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function updateStatusStatus(taskId, status) {
    updateTaskStatus({ taskId, status }).catch(() => {});
  }
}
