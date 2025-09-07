import React, { useState, useEffect } from "react";

// Example type for a training exercise
type TrainingExercise = {
    id: number;
    name: string;
    weight: number;
    reps: number;
    repeats: number;
    difficulty: "easy" | "spot on" | "hard";
    primaryMuscle: string;
    secondaryMuscle: string;
};

// Placeholder for database fetch and post (replace with real API calls)
const fetchExercises = async (): Promise<TrainingExercise[]> => {
    // TODO: Replace with API/database call
    return [
        {
            id: 1,
            name: "Bench Press",
            weight: 60,
            reps: 10,
            repeats: 3,
            difficulty: "spot on",
            primaryMuscle: "Chest",
            secondaryMuscle: "Triceps",
        },
    ];
};

const addExercise = async (exercise: Omit<TrainingExercise, "id">): Promise<TrainingExercise> => {
    // TODO: Replace with API/database call
    return { ...exercise, id: Date.now() };
};

const Dashboard: React.FC = () => {
    const [exercises, setExercises] = useState<TrainingExercise[]>([]);
    const [form, setForm] = useState<Omit<TrainingExercise, "id">>({
        name: "",
        weight: 0,
        reps: 0,
        repeats: 0,
        difficulty: "easy",
        primaryMuscle: "",
        secondaryMuscle: "",
    });

    useEffect(() => {
        fetchExercises().then(setExercises);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "weight" || name === "reps" || name === "repeats" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newExercise = await addExercise(form);
        setExercises((prev) => [...prev, newExercise]);
        setForm({
            name: "",
            weight: 0,
            reps: 0,
            repeats: 0,
            difficulty: "easy",
            primaryMuscle: "",
            secondaryMuscle: "",
        });
    };

    return (
        <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
            <h2>Training Dashboard</h2>
            <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
                <div>
                    <label>
                        Name: <input name="name" value={form.name} onChange={handleInputChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        Weight (kg): <input name="weight" type="number" value={form.weight} onChange={handleInputChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        Reps: <input name="reps" type="number" value={form.reps} onChange={handleInputChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        Repeats: <input name="repeats" type="number" value={form.repeats} onChange={handleInputChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        Difficulty: 
                        <select name="difficulty" value={form.difficulty} onChange={handleInputChange}>
                            <option value="easy">Easy</option>
                            <option value="spot on">Spot on</option>
                            <option value="hard">Hard</option>
                        </select>
                    </label>
                </div>
                <div>
                    <label>
                        Primary Muscle Group: <input name="primaryMuscle" value={form.primaryMuscle} onChange={handleInputChange} required />
                    </label>
                </div>
                <div>
                    <label>
                        Secondary Muscle Group: <input name="secondaryMuscle" value={form.secondaryMuscle} onChange={handleInputChange} />
                    </label>
                </div>
                <button type="submit" style={{ marginTop: 12 }}>Add Exercise</button>
            </form>
            <h3>Exercises</h3>
            <table border={1} cellPadding={6} style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Weight</th>
                        <th>Reps</th>
                        <th>Repeats</th>
                        <th>Difficulty</th>
                        <th>Primary Muscle</th>
                        <th>Secondary Muscle</th>
                    </tr>
                </thead>
                <tbody>
                    {exercises.map((ex) => (
                        <tr key={ex.id}>
                            <td>{ex.name}</td>
                            <td>{ex.weight}</td>
                            <td>{ex.reps}</td>
                            <td>{ex.repeats}</td>
                            <td>{ex.difficulty}</td>
                            <td>{ex.primaryMuscle}</td>
                            <td>{ex.secondaryMuscle}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;