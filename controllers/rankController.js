require("dotenv").config();
// Load model
const { Rank } = require("../db");
const { Op, fn, col } = require("sequelize");
const configUpload = require("../services/upload");

module.exports.createManySale;
// get all season
module.exports.createRank = async (req, res, next) => {
  try {
    if (req.file) {
      let { order } = req.body;
      order = Number(order);
      const data = req.body;
      // check order exits
      await updateOrder(data);
      data.image_url = req.file.path;
      const result = await Rank.create(data);
      return res.status(201).json(result);
    } else {
      return next({ statusCode: 400, message: "Chưa có ảnh" });
    }
  } catch (error) {
    next(error);
  }
};
module.exports.editRank = async (req, res, next) => {
  try {
    const data = req.body;

    if (req.file) {
      data.image_url = req.file.path;
    }

    // nếu có cập nhật lại order
    if (req.body.order) {
      await updateOrder(req.body, "update", req.body.id);
    }
    const result = await Rank.update(data, {
      where: {
        id: {
          [Op.eq]: req.body.id,
        },
      },
    });
    return res.status(200).json("sucess");
  } catch (error) {
    next(error);
  }
};
module.exports.deleteRank = async (req, res, next) => {
  const id = req.params.id;
  try {
    const deleted = await Rank.findByPk(id);
    if (!deleted) {
      return next({ statusCode: 404, message: "Không tồn tại" });
    }
    await updateOrder(deleted.toJSON(), "delete", id);
    await Rank.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });

    res.json({
      status: "success",
      result: {
        deletedSale: deleted,
      },
    });
  } catch (error) {
    next(error);
  }
};
module.exports.searchRank = async (req, res, next) => {
  try {
    let { rank_name, page, limit } = req.query;
    if (isNaN(page) || !page || !Number.isInteger(Number(page))) {
      page = 1;
    }
    if (isNaN(limit) || !limit || !Number.isInteger(Number(limit))) {
      limit = 30;
    }
    const offset = (Number(page) - 1) * Number(limit);
    if (!rank_name) rank_name = "";

    const totalRanks = await Rank.count({
      where: {
        rank_name: {
          [Op.like]: `%${rank_name}%`,
        },
      },
    });
    const result = await Rank.findAll({
      where: {
        rank_name: {
          [Op.like]: `%${rank_name}%`,
        },
      },
      limit: Number(limit),
      offset: offset,
      order: [["order"]],
    });

    const totalPages = Math.ceil(totalRanks / limit);

    res.status(200).json({
      data: result,
      total: totalRanks,
      page: parseInt(page),
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.getDetailRank = async (req, res, next) => {
  const { id } = req.params;

  try {
    const sale = await Rank.findByPk(id);

    if (sale) {
      res.status(200).json(sale);
    } else {
      return next({ statusCode: 404, message: "Không tồn tại" });
    }
  } catch (error) {
    // Xử lý lỗi nếu có lỗi trong quá trình truy vấn
    next(error);
  }
};

/// Update lại order
const updateOrder = async (data, mode = "create", id) => {
  let listArrOrder = await Rank.findAll({
    order: [["order", "ASC"]],
    raw: true,
  });
  let order = data.order;
  let maxOrder;
  let minOrder;

  if (listArrOrder.length > 0) {
    maxOrder = listArrOrder[listArrOrder.length - 1].order;
    minOrder = listArrOrder[0].order;
    if (order < minOrder) {
      order = minOrder;
    }
    if (order > maxOrder || !order) {
      order = maxOrder + 1;
    }

    data.order = order;
    console.log(minOrder, maxOrder);
    console.log(order);
    // check exits
    const indexExistOrder = listArrOrder.findIndex((i) => i.order == order);

    if (indexExistOrder >= 0 && (mode === "create" || mode === "delete")) {
      listArrOrder =
        mode === "delete"
          ? listArrOrder.slice(indexExistOrder + 1)
          : listArrOrder.slice(indexExistOrder);
      console.log(indexExistOrder);
    } else if (mode === "update") {
      listArrOrder = changeOrderUpdate(id, order, listArrOrder);
    }

    if (indexExistOrder >=0) {
      for (let i = 0; i < listArrOrder.length; i++) {
        const newRank = listArrOrder[i];
        newRank.order =
          mode === "create"
            ? newRank.order + 1
            : mode === "delete"
            ? newRank.order - 1
            : newRank.order;
        await Rank.update(newRank, {
          where: {
            id: newRank.id,
          },
        });
      }
    }
  }
};

/// Change Order update Rank
function changeOrderUpdate(id, order, arr) {
  const UpdateItem = arr.find((item) => item.id == id);

  if (!UpdateItem) {
    return arr;
  }

  const updatedArr = [...arr].filter((i) => i.id != id);
  updatedArr.splice(order - 1, 0, UpdateItem);
  for (let i = 0; i < updatedArr.length; i++) {
    updatedArr[i].order = i + 1;
  }

  return updatedArr.filter((i) => i.id != id);
}
