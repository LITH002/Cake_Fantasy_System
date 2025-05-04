import logo from './CF_Logo.jpeg';
import font from './CF_Font.png';
import cake_logo from './Cake_Logo.png';
import search_icon from './Search_Icon.png';
import cart from './Cart.png';
import cake_ingredients from './Cake_Ingredients.png';
import cake_tools from './Cake_Tools.png';
import party_items from './Party_Items.png';
import dum_glucose_syrup from './Dum_Glucose_Syrup.png';
import test_img from './menu_4.png';
import star_rate from './Rating.svg';
import silicone_spatula from './silicone_spatula.png';
import hbd_banner from './HBD_Banner.png';
import dum_b_powder from './Dum_B_Powder.png'
import silicone_mat from './Silicone_Mat.png';
import gold_num_candle from './Number_Candle_Gold.png';
import header from './header.svg';
import add_icon_white from './add_icon_white.svg';
import add_icon_green from './add_icon_green.svg';
import remove_icon from './remove_icon_red.svg';
import facebook from './Facebook.svg';
import whatsapp from './WhatsApp.svg';
import location from './Location.svg';
import cross_icon from './cross_icon.svg';
import Dum_BPowder_50g from './Dum_B.Powder_50g.jpg';

const assets = {
    logo,
    font,
    cake_logo,
    search_icon,
    cart,
    cake_ingredients,
    cake_tools,     
    party_items,
    dum_glucose_syrup,
    test_img,
    star_rate,
    silicone_spatula,
    hbd_banner,
    dum_b_powder,
    silicone_mat,
    gold_num_candle,
    header,
    add_icon_white,
    add_icon_green,
    remove_icon,
    facebook,
    whatsapp,
    location,
    cross_icon,
    Dum_BPowder_50g
};

export const category_list = [
    {
        category: "Cake Ingredients",
        category_image: test_img
    },
    {
        category: "Cake Tools",
        category_image: test_img
    },
    {
        category: "Party Items",
        category_image: test_img
    }
]

export const item_list = [
    {
        _id: "1",
        name: "Dum Glucose Syrup",
        image: dum_glucose_syrup,
        price: 100,
        description: "",
        category: "Cake Ingredients",
        // rating: 3
    },
    {
        _id: "2",
        name: "Silcone Spatula",
        image: silicone_spatula,
        price: 100,
        description: "",
        category: "Cake Tools",
    },
    {
        _id: "3",
        name: "Happy Birthday Banner",
        image: hbd_banner,
        price: 100,
        description: "",
        category: "Party Items",
    },
    {
        _id: "4",
        name: "Dum Baking Powder",
        image: dum_b_powder,
        price: 100,
        description: "",
        category: "Cake Ingredients",
    },
    {
        _id: "5",
        name: "Silicone Mat",
        image: silicone_mat,
        price: 100,
        description: "",
        category: "Cake Tools",
    },
    {
        _id: "6",
        name: "Number Candle - Gold",
        image: gold_num_candle,
        price: 100,
        description: "",
        category: "Party Items",
    }
]

export default assets;