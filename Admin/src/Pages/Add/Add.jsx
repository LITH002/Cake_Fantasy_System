import React, { useState } from "react";
import "./Add.css";
import assets from "../../assets/assets";
import { toast } from "react-toastify";

const Add = ({url}) => {
  
  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Cake Ingredients", // Default option
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Validate all fields including image
    if (!image || !data.name || !data.description || !data.price || !data.category) {
      toast.error("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("image", image); // This should be the file object

    try {
      const response = await fetch(`${url}/api/item/add`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - browser will set it automatically with boundary
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add item");
      }

      // Reset form on success
      setData({
        name: "",
        description: "",
        price: "",
        category: "Cake Ingredients",
      });
      setImage(null);
      toast.success(result.message || "Item added successfully");
      
    } catch (error) {
      console.error("Error while adding item:", error);
      toast.error(error.message || "Something went wrong while adding the item.");
    }
  };

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden required/>
        </div>

        <div className="add-product-name flex-col">
          <p>Item Name</p>
          <input onChange={onChangeHandler} value={data.name} type="text" name="name" placeholder="Type Here" autoComplete="off" required/>
        </div>

        <div className="add-product-description flex-col">
          <p>Item Description</p>
          <textarea onChange={onChangeHandler} value={data.description} name="description" rows="6" placeholder="Write Content Here" required></textarea>
        </div>

        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Item Category</p>
            <select onChange={onChangeHandler} name="category" value={data.category} required>
              <option value="Cake Ingredients">Cake Ingredients</option>
              <option value="Cake Tools">Cake Tools</option>
              <option value="Party Items">Party Items</option>
            </select>
          </div>
          <div className="add-price flex-col">
            <p>Item Price</p>
            <input onChange={onChangeHandler} value={data.price} type="number" name="price" placeholder="LKR 20" required min="0" step="0.01"/>
          </div>
        </div>

        <button type="submit" className="add-btn">
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;